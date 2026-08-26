-- Run after supabase/deep-bug-fixes.sql.
-- These policies and triggers provide defence in depth if a browser calls Supabase
-- directly instead of using the PawHome server routes.

begin;

create or replace function public.is_pawhome_backend_request()
returns boolean
language sql
stable
set search_path = public, auth
as $$
  select current_user in ('postgres', 'service_role', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role';
$$;

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_pawhome_backend_request() then
      new.user_id := auth.uid();
      new.phone_verified := false;
      new.verified_phone_e164 := null;
      new.seller_verification_status := 'unverified';
      new.seller_verified_type := null;
      new.seller_verified_at := null;
      new.seller_verified_by := null;
    end if;

    return new;
  end if;

  -- Changing the number always invalidates its previous verification, including
  -- changes performed by a backend/admin process.
  if new.phone_code is distinct from old.phone_code
    or new.phone_number is distinct from old.phone_number then
    new.phone_verified := false;
    new.verified_phone_e164 := null;
  end if;

  if not public.is_pawhome_backend_request() then
    new.user_id := old.user_id;
    new.phone_verified := case
      when new.phone_code is distinct from old.phone_code
        or new.phone_number is distinct from old.phone_number
      then false
      else old.phone_verified
    end;
    new.verified_phone_e164 := case
      when new.phone_code is distinct from old.phone_code
        or new.phone_number is distinct from old.phone_number
      then null
      else old.verified_phone_e164
    end;
    new.seller_verification_status := old.seller_verification_status;
    new.seller_verified_type := old.seller_verified_type;
    new.seller_verified_at := old.seller_verified_at;
    new.seller_verified_by := old.seller_verified_by;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_security_fields_trigger on public.profiles;
create trigger protect_profile_security_fields_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_security_fields();

create or replace function public.protect_listing_security_fields()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if public.is_pawhome_backend_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.seller_type := 'Private Seller';
    new.seller_verified := false;
    new.seller_verified_at := null;
    new.views := 0;
    new.favourites_count := 0;
    new.phone_clicks := 0;
    return new;
  end if;

  new.user_id := old.user_id;
  new.status := old.status;
  new.seller_name := old.seller_name;
  new.seller_type := old.seller_type;
  new.seller_verified := old.seller_verified;
  new.seller_verified_at := old.seller_verified_at;
  new.contact_phone := old.contact_phone;
  new.submission_key := old.submission_key;
  new.views := old.views;
  new.favourites_count := old.favourites_count;
  new.phone_clicks := old.phone_clicks;

  return new;
end;
$$;

drop trigger if exists protect_listing_security_fields_trigger on public.listings;
create trigger protect_listing_security_fields_trigger
before insert or update on public.listings
for each row execute function public.protect_listing_security_fields();

-- -----------------------------------------------------------------------------
-- Row-level security. Restrictive ownership policies limit any existing permissive
-- policies, while explicit read policies preserve public approved listings.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.favorites enable row level security;

-- Profiles: users may read and edit only their own row. Server/service-role requests
-- bypass RLS and retain moderation access.
drop policy if exists pawhome_profiles_own_select on public.profiles;
create policy pawhome_profiles_own_select
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists pawhome_profiles_own_insert_guard on public.profiles;
create policy pawhome_profiles_own_insert_guard
on public.profiles
as restrictive
for insert
with check (auth.uid() = user_id);

drop policy if exists pawhome_profiles_own_update_guard on public.profiles;
create policy pawhome_profiles_own_update_guard
on public.profiles
as restrictive
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists pawhome_profiles_own_delete_guard on public.profiles;
create policy pawhome_profiles_own_delete_guard
on public.profiles
as restrictive
for delete
using (auth.uid() = user_id);

-- Listings: everyone may read approved rows; authenticated owners may also read
-- their own pending/rejected rows. Any direct mutation is restricted to ownership,
-- then the trigger preserves moderation and trust fields.
drop policy if exists pawhome_listings_public_approved_select on public.listings;
create policy pawhome_listings_public_approved_select
on public.listings
for select
using (status = 'approved');

drop policy if exists pawhome_listings_owner_select on public.listings;
create policy pawhome_listings_owner_select
on public.listings
for select
using (auth.uid() = user_id);

drop policy if exists pawhome_listings_owner_insert_guard on public.listings;
create policy pawhome_listings_owner_insert_guard
on public.listings
as restrictive
for insert
with check (auth.uid() = user_id);

drop policy if exists pawhome_listings_owner_update_guard on public.listings;
create policy pawhome_listings_owner_update_guard
on public.listings
as restrictive
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists pawhome_listings_owner_delete_guard on public.listings;
create policy pawhome_listings_owner_delete_guard
on public.listings
as restrictive
for delete
using (auth.uid() = user_id);

-- Listing photos follow the visibility/ownership of their parent listing.
drop policy if exists pawhome_listing_photos_visible_select on public.listing_photos;
create policy pawhome_listing_photos_visible_select
on public.listing_photos
for select
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and (listings.status = 'approved' or listings.user_id = auth.uid())
  )
);

drop policy if exists pawhome_listing_photos_owner_insert_guard on public.listing_photos;
create policy pawhome_listing_photos_owner_insert_guard
on public.listing_photos
as restrictive
for insert
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and listings.user_id = auth.uid()
  )
);

drop policy if exists pawhome_listing_photos_owner_update_guard on public.listing_photos;
create policy pawhome_listing_photos_owner_update_guard
on public.listing_photos
as restrictive
for update
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and listings.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and listings.user_id = auth.uid()
  )
);

drop policy if exists pawhome_listing_photos_owner_delete_guard on public.listing_photos;
create policy pawhome_listing_photos_owner_delete_guard
on public.listing_photos
as restrictive
for delete
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and listings.user_id = auth.uid()
  )
);

-- Favourites are private to their owner.
drop policy if exists pawhome_favorites_owner_access on public.favorites;
create policy pawhome_favorites_owner_access
on public.favorites
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
