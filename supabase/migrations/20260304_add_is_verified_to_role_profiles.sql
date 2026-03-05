alter table public.renter_profiles
add column if not exists is_verified boolean not null default false;

alter table public.landlord_profiles
add column if not exists is_verified boolean not null default false;
