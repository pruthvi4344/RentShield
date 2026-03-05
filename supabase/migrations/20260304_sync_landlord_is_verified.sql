create or replace function public.sync_landlord_is_verified()
returns trigger
language plpgsql
as $$
begin
  new.is_verified :=
    new.identity_verification_status = 'verified'
    and new.property_ownership_status = 'verified'
    and new.phone_verification_status = 'verified';

  return new;
end;
$$;

drop trigger if exists sync_landlord_is_verified on public.landlord_profiles;
create trigger sync_landlord_is_verified
before insert or update of identity_verification_status, property_ownership_status, phone_verification_status
on public.landlord_profiles
for each row execute function public.sync_landlord_is_verified();

update public.landlord_profiles
set is_verified = (
  identity_verification_status = 'verified'
  and property_ownership_status = 'verified'
  and phone_verification_status = 'verified'
);
