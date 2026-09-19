-- Additive litter-manager migration.
-- Safe for existing listings: no current row is changed and no new listing
-- column is required. Run this in Supabase SQL Editor before enabling sellers
-- to create individual litter cards.

create table if not exists public.litter_animals (
  id uuid primary key default gen_random_uuid(),
  listing_id bigint not null references public.listings(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  sex text not null check (sex in ('Male', 'Female')),
  colour text check (colour is null or char_length(colour) <= 80),
  price numeric(10, 2) check (price is null or (price > 0 and price <= 1000000)),
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  description text check (description is null or char_length(description) <= 300),
  image_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0 and sort_order < 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists litter_animals_listing_id_idx
  on public.litter_animals (listing_id, sort_order);

create index if not exists litter_animals_listing_status_idx
  on public.litter_animals (listing_id, status);

alter table public.litter_animals enable row level security;

revoke all on table public.litter_animals from anon, authenticated;
grant select on table public.litter_animals to anon;
grant select, insert, update, delete on table public.litter_animals to authenticated;
grant all on table public.litter_animals to service_role;

drop policy if exists "Public can view animals in approved litters" on public.litter_animals;
create policy "Public can view animals in approved litters"
  on public.litter_animals
  for select
  to anon
  using (
    exists (
      select 1
      from public.listings
      where listings.id = litter_animals.listing_id
        and listings.status = 'approved'
        and listings.sex = 'Mixed Litter'
    )
  );

drop policy if exists "Owners can view their litter animals" on public.litter_animals;
create policy "Owners can view their litter animals"
  on public.litter_animals
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = litter_animals.listing_id
        and (listings.user_id = auth.uid() or listings.status = 'approved')
    )
  );

drop policy if exists "Owners can add litter animals" on public.litter_animals;
create policy "Owners can add litter animals"
  on public.litter_animals
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.listings
      where listings.id = litter_animals.listing_id
        and listings.user_id = auth.uid()
        and listings.sex = 'Mixed Litter'
        and listings.animal_type in ('Dogs', 'Cats')
    )
  );

drop policy if exists "Owners can update litter animals" on public.litter_animals;
create policy "Owners can update litter animals"
  on public.litter_animals
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = litter_animals.listing_id
        and listings.user_id = auth.uid()
        and listings.sex = 'Mixed Litter'
    )
  )
  with check (
    exists (
      select 1
      from public.listings
      where listings.id = litter_animals.listing_id
        and listings.user_id = auth.uid()
        and listings.sex = 'Mixed Litter'
    )
  );

drop policy if exists "Owners can delete litter animals" on public.litter_animals;
create policy "Owners can delete litter animals"
  on public.litter_animals
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = litter_animals.listing_id
        and listings.user_id = auth.uid()
    )
  );
