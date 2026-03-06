alter table public.renter_profiles
add column if not exists is_roommate_profile_public boolean not null default false;

alter table public.renter_profiles
add column if not exists roommate_preferred_gender text;

drop policy if exists "Renter can view own profile" on public.renter_profiles;

create policy "Renters can view own or public roommate profiles"
  on public.renter_profiles
  for select
  to authenticated
  using (auth.uid() = id or is_roommate_profile_public = true);
