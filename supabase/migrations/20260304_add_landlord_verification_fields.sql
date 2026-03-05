alter table public.landlord_profiles
add column if not exists identity_verification_status text not null default 'not_submitted'
  check (identity_verification_status in ('not_submitted', 'pending', 'verified'));

alter table public.landlord_profiles
add column if not exists property_ownership_status text not null default 'not_submitted'
  check (property_ownership_status in ('not_submitted', 'pending', 'verified'));

alter table public.landlord_profiles
add column if not exists phone_verification_status text not null default 'not_submitted'
  check (phone_verification_status in ('not_submitted', 'pending', 'verified'));

alter table public.landlord_profiles
add column if not exists identity_document_name text;

alter table public.landlord_profiles
add column if not exists property_document_name text;

alter table public.landlord_profiles
add column if not exists phone_number_for_verification text;
