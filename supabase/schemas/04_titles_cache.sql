-- Declarative counterpart to migrations/20260728120000_titles_cache.sql.
--
-- This directory is the current-state description of the schema; the
-- migrations directory is the ordered history that produces it. The migration
-- was written and applied first, so this file exists to stop the two drifting
-- — without it, a `supabase db diff` would propose dropping the table.
--
-- See the migration for the full rationale. In short: `histories` stores no
-- genre data, so the recommendation engine (§7) would otherwise need one TMDB
-- detail call per history row. This turns that fan-out into a single indexed
-- lookup, keyed by title rather than by user, so it is shared across everyone
-- and fills itself in as titles are watched.

create table public.titles_cache (
  -- '<media_type>:<source_id>', e.g. 'movie:27205' or 'anime:21'. The primary
  -- key is this exact string because every read builds it directly from a
  -- `histories` row, with no join.
  title_key text primary key,

  media_type text not null check (media_type in ('movie', 'tv', 'anime')),

  -- Provider-native id: TMDB for movie/tv, AniList for anime. The two id
  -- spaces are unrelated, which is why media_type is part of the key.
  source_id integer not null,

  -- Equals source_id for movie/tv; null for anime. Kept separate so a future
  -- TMDB<->AniList mapping can populate it without a migration.
  tmdb_id integer,

  -- TMDB numeric genre ids. Empty for anime.
  -- TMDB's movie and TV vocabularies only partly overlap (28 "Action" for film
  -- vs 10759 "Action & Adventure" for TV), so consumers must keep the two
  -- affinity profiles separate rather than pooling these.
  genre_ids integer[] not null default '{}',

  -- Genre names. The only genre signal anime has, since AniList genres are
  -- strings rather than ids.
  genre_names text[] not null default '{}',

  original_language text,
  popularity real,
  vote_average numeric(4, 1),

  -- Genres effectively never change, so refreshes are lazy. This exists to
  -- make a future TTL sweep possible without guessing.
  refreshed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),

  -- Bounds so the arrays cannot be used as general-purpose blob storage by any
  -- account that can reach the writer.
  constraint titles_cache_genre_bounds check (
    coalesce(array_length(genre_ids, 1), 0) <= 32
    and coalesce(array_length(genre_names, 1), 0) <= 32
    and source_id > 0
  )
);

-- The engine reads one media type at a time, so type is the useful secondary
-- axis.
create index titles_cache_media_type_idx on public.titles_cache (media_type, source_id);

create index titles_cache_refreshed_idx on public.titles_cache (refreshed_at);

alter table public.titles_cache enable row level security;

-- Public metadata, not user data.
create policy "Anyone can read titles_cache"
on public.titles_cache
for select
to anon, authenticated
using (true);

-- The cache warms itself: on a miss the engine fetches genres live and writes them
-- back using the caller's own session. SUPABASE_SERVICE_ROLE_KEY is optional in
-- this project's env schema, so a service-role-only writer would leave any
-- deployment without that key reading an eternally empty cache.
--
-- There are deliberately NO blanket insert/update policies for `authenticated`.
-- This table has no user_id column, so `with check (true)` would not mean "users
-- may write their own rows" — it would mean any account may overwrite any row for
-- everyone, straight through PostgREST with the publishable key, without touching
-- the app. Writes go through `public.upsert_title_cache` instead (security
-- definer, validates media_type / source_id / genre cardinality), granted to
-- `authenticated` only. See migrations/20260806120000_security_hardening.sql.
--
-- Residual trade-off, unchanged: a signed-in user can still seed *wrong* genres
-- for a title through the RPC. Blast radius is one badly-ordered recommendation
-- row — no personal data, and nothing else reads this table.

-- No delete policy. Nothing in the app removes cache rows; eviction belongs to
-- a scheduled job running as service role.
