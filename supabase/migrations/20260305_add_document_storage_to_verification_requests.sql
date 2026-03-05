alter table public.landlord_verification_requests
add column if not exists document_storage_path text;

alter table public.landlord_verification_requests
add column if not exists document_content_type text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-documents',
  'verification-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

drop policy if exists "Landlords can upload own verification documents" on storage.objects;
create policy "Landlords can upload own verification documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Landlords can view own verification documents" on storage.objects;
create policy "Landlords can view own verification documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
