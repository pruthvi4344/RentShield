create table if not exists public.landlord_listings (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.landlord_profiles(id) on delete cascade,
  title text not null,
  property_type text not null,
  street_address text not null,
  city text not null,
  postal_code text,
  bedrooms integer not null default 1,
  bathrooms integer not null default 1,
  square_feet integer,
  furnished_status text not null default 'furnished'
    check (furnished_status in ('furnished', 'unfurnished', 'partially')),
  monthly_rent numeric(10, 2) not null,
  security_deposit numeric(10, 2),
  utilities_included boolean not null default false,
  amenities text[] not null default '{}'::text[],
  available_from date,
  lease_duration_months integer,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rented', 'inactive')),
  views_count integer not null default 0,
  inquiries_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.landlord_listings(id) on delete cascade,
  landlord_id uuid not null references public.landlord_profiles(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_landlord_listings_landlord_created
  on public.landlord_listings (landlord_id, created_at desc);

create index if not exists idx_listing_photos_listing_sort
  on public.listing_photos (listing_id, sort_order asc);

alter table public.landlord_listings enable row level security;
alter table public.listing_photos enable row level security;

drop policy if exists "Landlord can view own listings" on public.landlord_listings;
create policy "Landlord can view own listings"
  on public.landlord_listings
  for select
  using (auth.uid() = landlord_id);

drop policy if exists "Landlord can insert own listings" on public.landlord_listings;
create policy "Landlord can insert own listings"
  on public.landlord_listings
  for insert
  with check (auth.uid() = landlord_id);

drop policy if exists "Landlord can update own listings" on public.landlord_listings;
create policy "Landlord can update own listings"
  on public.landlord_listings
  for update
  using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

drop policy if exists "Landlord can delete own listings" on public.landlord_listings;
create policy "Landlord can delete own listings"
  on public.landlord_listings
  for delete
  using (auth.uid() = landlord_id);

drop policy if exists "Landlord can view own listing photos" on public.listing_photos;
create policy "Landlord can view own listing photos"
  on public.listing_photos
  for select
  using (auth.uid() = landlord_id);

drop policy if exists "Landlord can insert own listing photos" on public.listing_photos;
create policy "Landlord can insert own listing photos"
  on public.listing_photos
  for insert
  with check (auth.uid() = landlord_id);

drop policy if exists "Landlord can delete own listing photos" on public.listing_photos;
create policy "Landlord can delete own listing photos"
  on public.listing_photos
  for delete
  using (auth.uid() = landlord_id);

grant select, insert, update, delete on table public.landlord_listings to authenticated;
grant select, insert, delete on table public.listing_photos to authenticated;

drop trigger if exists set_landlord_listings_updated_at on public.landlord_listings;
create trigger set_landlord_listings_updated_at
before update on public.landlord_listings
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Landlords can upload own listing photos" on storage.objects;
create policy "Landlords can upload own listing photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Landlords can view own listing photos in storage" on storage.objects;
create policy "Landlords can view own listing photos in storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Landlords can delete own listing photos in storage" on storage.objects;
create policy "Landlords can delete own listing photos in storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
