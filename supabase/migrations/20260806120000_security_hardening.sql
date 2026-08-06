-- Security hardening pass.
--
-- Three independent changes, each safe to apply on its own:
--   1. titles_cache: replace "any authenticated user may write anything" with a
--      validating writer function.
--   2. Revoke TRUNCATE from anon/authenticated on the user tables.
--   3. Add an (initially inert) trigger that creates the profiles row, so the
--      application can stop borrowing the service-role key to do it.
--
-- Nothing here changes behaviour for existing application code. Item 3 activates
-- only once the app starts passing a username in the signUp metadata.

-- ---------------------------------------------------------------------------
-- 1. titles_cache: stop letting any signed-in user rewrite the shared cache
-- ---------------------------------------------------------------------------
--
-- The previous policies were `with check (true)` / `using (true)` for INSERT and
-- UPDATE to `authenticated`. Because the table has no user_id column, that is not
-- "users may write their own rows" — it is "any account may overwrite any row for
-- every user". A signed-up attacker did not even need the app: the publishable key
-- plus their own JWT is enough to PATCH arbitrary genre_ids straight through
-- PostgREST and degrade recommendation ordering site-wide. There was also no bound
-- on the arrays, so one request could store megabyte-sized genre lists.
--
-- Writes now go through a security-definer function that validates its input, so
-- callers get exactly one shape of write and nothing else.

drop policy if exists "Authenticated users can seed titles_cache" on public.titles_cache;
drop policy if exists "Authenticated users can refresh titles_cache" on public.titles_cache;

alter table public.titles_cache
  drop constraint if exists titles_cache_genre_bounds;

alter table public.titles_cache
  add constraint titles_cache_genre_bounds check (
    coalesce(array_length(genre_ids, 1), 0) <= 32
    and coalesce(array_length(genre_names, 1), 0) <= 32
    and source_id > 0
  );

create or replace function public.upsert_title_cache(
  p_media_type text,
  p_source_id integer,
  p_tmdb_id integer default null,
  p_genre_ids integer[] default '{}',
  p_genre_names text[] default '{}',
  p_original_language text default null,
  p_popularity real default null,
  p_vote_average numeric default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_genre_names text[];
begin
  -- Only signed-in callers may warm the cache.
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_media_type not in ('movie', 'tv', 'anime') then
    raise exception 'invalid media_type: %', p_media_type;
  end if;

  if p_source_id is null or p_source_id <= 0 then
    raise exception 'invalid source_id';
  end if;

  if coalesce(array_length(p_genre_ids, 1), 0) > 32
     or coalesce(array_length(p_genre_names, 1), 0) > 32 then
    raise exception 'too many genres';
  end if;

  -- Cap individual label length so the arrays cannot be used as blob storage.
  select coalesce(array_agg(left(name, 64)), '{}')
    into v_genre_names
    from unnest(coalesce(p_genre_names, '{}')) as name;

  insert into public.titles_cache as t (
    title_key, media_type, source_id, tmdb_id,
    genre_ids, genre_names, original_language, popularity, vote_average, refreshed_at
  )
  values (
    p_media_type || ':' || p_source_id,
    p_media_type,
    p_source_id,
    p_tmdb_id,
    coalesce(p_genre_ids, '{}'),
    v_genre_names,
    left(p_original_language, 16),
    p_popularity,
    p_vote_average,
    now()
  )
  on conflict (title_key) do update
    set genre_ids = excluded.genre_ids,
        genre_names = excluded.genre_names,
        tmdb_id = coalesce(excluded.tmdb_id, t.tmdb_id),
        original_language = excluded.original_language,
        popularity = excluded.popularity,
        vote_average = excluded.vote_average,
        refreshed_at = now();
end;
$$;

revoke all on function public.upsert_title_cache(
  text, integer, integer, integer[], text[], text, real, numeric
) from public, anon;

grant execute on function public.upsert_title_cache(
  text, integer, integer, integer[], text[], text, real, numeric
) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Revoke TRUNCATE from client roles
-- ---------------------------------------------------------------------------
--
-- The initial migration granted TRUNCATE to anon and authenticated on all three
-- user tables. Postgres does not apply row-level security to TRUNCATE, so this is
-- a privilege the RLS policies cannot contain: one successful call empties the
-- table for every user. PostgREST exposes no TRUNCATE verb today, which is the
-- only reason this was not already exploitable — that is a property of the current
-- API surface, not a permission boundary.

revoke truncate on table public.histories from anon, authenticated;
revoke truncate on table public.profiles from anon, authenticated;
revoke truncate on table public.watchlist from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Create the profiles row in the database, not in the sign-up action
-- ---------------------------------------------------------------------------
--
-- Two problems this solves.
--
-- (a) The sign-up server action had to borrow the SERVICE ROLE key to insert the
--     profile row, because a user who has not yet confirmed their email has no
--     session and so cannot satisfy the `auth.uid() = id` insert policy. That put
--     a full-database credential on an unauthenticated code path.
--
-- (b) Sign-up was not atomic: `auth.signUp` succeeded, then the profile insert
--     could fail, leaving an auth user with no profile — and because the address is
--     now taken, that account can never be re-registered. The application code
--     documents this as a known bug awaiting a database-level fix.
--
-- The trigger is deliberately INERT until the app opts in: it fires only when the
-- sign-up passed a username in user metadata. To activate, add
--   options: { data: { username: data.username } }
-- to the supabase.auth.signUp call in src/actions/auth.ts, then delete the
-- service-role insert that follows it (and the `admin` parameter on createClient).
-- Until then this changes nothing.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
begin
  v_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  if v_username is null then
    return new;
  end if;

  insert into public.profiles (id, username)
  values (new.id, left(v_username, 64))
  on conflict (id) do nothing;

  return new;
exception
  -- A duplicate username must not abort account creation; the application checks
  -- availability before calling signUp, and a lost race is better handled as a
  -- missing profile than as a failed signup.
  when unique_violation then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
