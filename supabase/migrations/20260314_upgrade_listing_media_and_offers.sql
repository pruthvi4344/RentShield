alter table public.landlord_listings
add column if not exists discount_percentage integer check (discount_percentage between 1 and 100);

alter table public.landlord_listings
add column if not exists discount_duration_months integer check (discount_duration_months between 1 and 3);

alter table public.landlord_listings
add column if not exists limited_time_offer_title text;

alter table public.landlord_listings
add column if not exists limited_time_offer_description text;

alter table public.landlord_listings
add column if not exists limited_time_offer_expires_at date;

alter table public.landlord_listings
add column if not exists internet_included boolean not null default false;

alter table public.landlord_listings
add column if not exists parking_included boolean not null default false;

alter table public.landlord_listings
add column if not exists featured_listing boolean not null default false;

alter table public.landlord_listings
add column if not exists matterport_url text;

alter table public.landlord_listings
add column if not exists matterport_embed text;

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.landlord_listings(id) on delete cascade,
  landlord_id uuid not null references public.landlord_profiles(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_media_listing_sort
  on public.listing_media (listing_id, sort_order asc);

alter table public.listing_media enable row level security;

drop policy if exists "Landlord can view own listing media" on public.listing_media;
create policy "Landlord can view own listing media"
  on public.listing_media
  for select
  using (auth.uid() = landlord_id);

drop policy if exists "Landlord can insert own listing media" on public.listing_media;
create policy "Landlord can insert own listing media"
  on public.listing_media
  for insert
  with check (auth.uid() = landlord_id);

drop policy if exists "Landlord can delete own listing media" on public.listing_media;
create policy "Landlord can delete own listing media"
  on public.listing_media
  for delete
  using (auth.uid() = landlord_id);

grant select, insert, delete on table public.listing_media to authenticated;

insert into public.listing_media (listing_id, landlord_id, storage_path, media_type, sort_order, created_at)
select
  lp.listing_id,
  lp.landlord_id,
  lp.storage_path,
  'image',
  lp.sort_order,
  lp.created_at
from public.listing_photos lp
where not exists (
  select 1
  from public.listing_media lm
  where lm.listing_id = lp.listing_id
    and lm.storage_path = lp.storage_path
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media',
  'listing-media',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;

drop policy if exists "Landlords can upload own listing media" on storage.objects;
create policy "Landlords can upload own listing media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Landlords can view own listing media in storage" on storage.objects;
create policy "Landlords can view own listing media in storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Landlords can delete own listing media in storage" on storage.objects;
create policy "Landlords can delete own listing media in storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
