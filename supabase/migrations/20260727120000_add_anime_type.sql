-- Anime uses AniList IDs, not TMDB IDs. The (user_id, media_id, type, ...)
-- keys already disambiguate by `type`, so this is the only schema change
-- adding anime support requires — no new columns, no ID-space collision.

alter table public.histories drop constraint histories_type_check;
alter table public.histories add constraint histories_type_check
  check (type in ('movie', 'tv', 'anime'));

alter table public.watchlist drop constraint watchlist_type_check;
alter table public.watchlist add constraint watchlist_type_check
  check (type in ('movie', 'tv', 'anime'));
