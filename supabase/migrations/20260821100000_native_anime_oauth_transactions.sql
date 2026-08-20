-- One-time server-side state for native AniList/MAL linking.
-- The native app receives only an authorization URL; provider secrets,
-- refresh tokens, and the user association remain on the server.
create table if not exists public.anime_oauth_transactions (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('anilist', 'mal')),
  code_verifier text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.anime_oauth_transactions enable row level security;
revoke all on table public.anime_oauth_transactions from anon, authenticated;
create index if not exists anime_oauth_transactions_expiry_idx
on public.anime_oauth_transactions (expires_at);
