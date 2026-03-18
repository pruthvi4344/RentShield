alter table public.renter_profiles
add column if not exists phone_verification_status text not null default 'not_submitted'
  check (phone_verification_status in ('not_submitted', 'pending', 'verified'));

alter table public.renter_profiles
add column if not exists phone_number_for_verification text;

update public.renter_profiles
set phone_verification_status = 'verified'
where is_verified = true
  and phone_verification_status <> 'verified';
