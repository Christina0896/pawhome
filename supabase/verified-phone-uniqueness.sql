-- Run this in Supabase SQL Editor before relying on duplicate-phone blocking.
-- Rule: one verified phone number can belong to only one PawHome account.

alter table profiles
add column if not exists verified_phone_e164 text;

-- Backfill existing verified profiles using the same normalisation idea as the app:
-- +353 + 0852400075 -> +353852400075
-- +353852400075 -> +353852400075
-- 00353852400075 -> +353852400075
update profiles
set verified_phone_e164 = case
  when phone_number ~ '^\\s*\\+' then '+' || regexp_replace(phone_number, '\\D', '', 'g')
  when regexp_replace(coalesce(phone_number, ''), '\\D', '', 'g') like '00%' then '+' || substring(regexp_replace(coalesce(phone_number, ''), '\\D', '', 'g') from 3)
  else '+' || regexp_replace(coalesce(phone_code, ''), '\\D', '', 'g') || regexp_replace(regexp_replace(coalesce(phone_number, ''), '\\D', '', 'g'), '^0+', '')
end
where phone_verified = true
  and verified_phone_e164 is null
  and coalesce(phone_number, '') <> '';

-- Check duplicates before creating the index. This should return zero rows.
select verified_phone_e164, count(*)
from profiles
where verified_phone_e164 is not null
group by verified_phone_e164
having count(*) > 1;

-- Create the unique index after the duplicate check returns zero rows.
create unique index if not exists unique_verified_phone_e164
on profiles (verified_phone_e164)
where verified_phone_e164 is not null;
