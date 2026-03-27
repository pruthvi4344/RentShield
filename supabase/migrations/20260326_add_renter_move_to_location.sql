alter table public.renter_profiles
add column if not exists move_to_country text,
add column if not exists move_to_province text,
add column if not exists move_to_city text,
add column if not exists move_to_postal_code text;

update public.renter_profiles
set move_to_country = coalesce(move_to_country, 'Canada')
where move_to_country is null;

update public.renter_profiles
set
  move_to_city = coalesce(move_to_city, nullif(trim(split_part(city, ',', 1)), '')),
  move_to_province = coalesce(move_to_province, nullif(upper(trim(split_part(city, ',', 2))), ''))
where city is not null
  and (move_to_city is null or move_to_province is null);
