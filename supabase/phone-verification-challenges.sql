-- Run this in the Supabase SQL Editor before testing voice phone verification.
-- Verification request IDs stay server-side and are bound to the authenticated user and saved phone number.

create table if not exists public.phone_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_e164 text not null,
  provider text not null default 'vonage' check (provider in ('vonage')),
  provider_request_id text not null unique,
  channel text not null default 'voice' check (channel in ('voice')),
  status text not null default 'pending'
    check (status in ('pending', 'provider_verified', 'completed', 'failed', 'expired', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_phone_verification_per_user
  on public.phone_verification_challenges (user_id)
  where status in ('pending', 'provider_verified');

create index if not exists phone_verification_user_created_idx
  on public.phone_verification_challenges (user_id, created_at desc);

create index if not exists phone_verification_phone_created_idx
  on public.phone_verification_challenges (phone_e164, created_at desc);

create index if not exists phone_verification_expiry_idx
  on public.phone_verification_challenges (expires_at);

alter table public.phone_verification_challenges enable row level security;

revoke all on table public.phone_verification_challenges from anon, authenticated;
grant all on table public.phone_verification_challenges to service_role;
