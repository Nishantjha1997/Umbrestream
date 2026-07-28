-- titles_cache — genre metadata for titles that appear in watch history (§7).
--
-- `histories` deliberately stores only what the resume rail renders: title,
-- artwork, position. It has no genre column. The recommendation engine needs
-- genres for every title a user has watched, and the naive way to get them is
-- one TMDB detail call per history row — which is slow, scales with how much
-- the user watches, and (when routed through /api/tmdb) trips that proxy's
-- 60 req/min limit on any account with a real history.
--
-- This table turns that fan-out into a single indexed query. It is a shared,
-- non-personal metadata cache: rows are keyed by title, not by user, so the
-- first person to watch a film pays the lookup and everyone after reads it
-- from Postgres.
--
-- Cold rows are still fetched on demand and written back here, so the table
-- fills itself in; it never needs seeding.

create table if not exists public.titles_cache (
  -- '<media_type>:<source_id>', e.g. 'movie:27205' or 'anime:21'. Primary key
  -- rather than a surrogate id because every read is a lookup by this exact
  -- string, built from a `histories` row without a join.
  title_key text primary key,

  media_type text not null check (media_type in ('movie', 'tv', 'anime')),

  -- Provider-native id. TMDB for movie/tv, AniList for anime — the two id
  -- spaces are unrelated, which is why `media_type` is part of the key.
  source_id integer not null,

  -- Non-null only for movie/tv, where it equals source_id. Kept as its own
  -- column (per the §7 sketch) so a future TMDB<->AniList mapping can populate
  -- it for anime rows without a migration.
  tmdb_id integer,

  -- TMDB's numeric genre ids. Empty for anime, which has no TMDB ids at all.
  -- Note that TMDB's movie and TV genre vocabularies only partly overlap
  -- (28 "Action" for film vs 10759 "Action & Adventure" for TV), so consumers
  -- must keep the two profiles separate rather than pooling these.
  genre_ids integer[] not null default '{}',

  -- Human-readable genre names. This is the only genre signal anime has,
  -- since AniList genres are strings ('Sci-Fi') and not ids.
  genre_names text[] not null default '{}',

  original_language text,
  popularity real,
  vote_average numeric(4, 1),

  -- When the metadata was last pulled from the provider. Genres effectively
  -- never change, so refreshes are lazy; this exists to make a future TTL
  -- sweep possible without guessing.
  refreshed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

-- The engine reads genres for one media type at a time (it will not mix TMDB
-- movie and TV genre ids), so the type is the useful secondary axis.
create index if not exists titles_cache_media_type_idx
on public.titles_cache (media_type, source_id);

create index if not exists titles_cache_refreshed_idx
on public.titles_cache (refreshed_at);

alter table public.titles_cache enable row level security;

-- Postgres has no `create policy if not exists`, and this migration is likely
-- to be applied by hand through the Management API — so each policy is dropped
-- first, making the whole file safely re-runnable.
drop policy if exists "Anyone can read titles_cache" on public.titles_cache;
drop policy if exists "Authenticated users can seed titles_cache" on public.titles_cache;
drop policy if exists "Authenticated users can refresh titles_cache" on public.titles_cache;

-- Public metadata, not user data: everyone may read it, including signed-out
-- visitors, whose home page also wants a genre-aware row eventually.
create policy "Anyone can read titles_cache"
on public.titles_cache
for select
to anon, authenticated
using (true);

-- The cache fills itself in: when the recommendation engine misses on a title
-- it fetches the genres live and upserts them back, using the caller's own
-- authenticated session. SUPABASE_SERVICE_ROLE_KEY is optional in this
-- project's env schema, so relying on a service-role writer would leave any
-- deployment without that key reading an eternally empty cache.
--
-- Trade-off, stated plainly: an authenticated user can write junk genre ids
-- for a title. The blast radius is one badly-ordered recommendation row — no
-- personal data is exposed and nothing else reads this table. Replace these
-- two policies with a service-role-only writer once that key is guaranteed.
create policy "Authenticated users can seed titles_cache"
on public.titles_cache
for insert
to authenticated
with check (true);

create policy "Authenticated users can refresh titles_cache"
on public.titles_cache
for update
to authenticated
using (true)
with check (true);

-- No delete policy. Nothing in the app removes cache rows, and eviction (if it
-- is ever needed) belongs to a scheduled job running as service role.
