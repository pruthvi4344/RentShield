alter table public.landlord_listings
add column if not exists formatted_address text,
add column if not exists place_id text,
add column if not exists latitude double precision,
add column if not exists longitude double precision;

create index if not exists idx_landlord_listings_place_id
  on public.landlord_listings (place_id);

create index if not exists idx_landlord_listings_lat_lng
  on public.landlord_listings (latitude, longitude);
