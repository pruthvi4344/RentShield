alter table public.landlord_listings
add column if not exists tour_360_storage_path text;

alter table public.listing_media
drop constraint if exists listing_media_media_type_check;

alter table public.listing_media
add constraint listing_media_media_type_check
check (media_type in ('image', 'video', 'panorama'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;

drop policy if exists "Landlords can upload own property media" on storage.objects;
create policy "Landlords can upload own property media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.landlord_listings ll
    where ll.id::text = (storage.foldername(name))[1]
      and ll.landlord_id = auth.uid()
  )
);

drop policy if exists "Landlords can view own property media in storage" on storage.objects;
create policy "Landlords can view own property media in storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.landlord_listings ll
    where ll.id::text = (storage.foldername(name))[1]
      and ll.landlord_id = auth.uid()
  )
);

drop policy if exists "Landlords can delete own property media in storage" on storage.objects;
create policy "Landlords can delete own property media in storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.landlord_listings ll
    where ll.id::text = (storage.foldername(name))[1]
      and ll.landlord_id = auth.uid()
  )
);
