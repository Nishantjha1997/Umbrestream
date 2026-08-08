alter table public.histories
  add column total_watched_seconds double precision not null default 0;
