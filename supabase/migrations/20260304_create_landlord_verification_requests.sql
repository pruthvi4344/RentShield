create table if not exists public.landlord_verification_requests (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.landlord_profiles(id) on delete cascade,
  request_type text not null check (request_type in ('identity', 'property')),
  document_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_notes text,
  reviewed_by text
);

create index if not exists idx_landlord_verification_requests_landlord_id
  on public.landlord_verification_requests (landlord_id);

create index if not exists idx_landlord_verification_requests_status_submitted_at
  on public.landlord_verification_requests (status, submitted_at desc);

alter table public.landlord_verification_requests enable row level security;

drop policy if exists "Landlord can insert own verification requests" on public.landlord_verification_requests;
create policy "Landlord can insert own verification requests"
  on public.landlord_verification_requests
  for insert
  with check (auth.uid() = landlord_id);

drop policy if exists "Landlord can view own verification requests" on public.landlord_verification_requests;
create policy "Landlord can view own verification requests"
  on public.landlord_verification_requests
  for select
  using (auth.uid() = landlord_id);

grant select, insert on table public.landlord_verification_requests to authenticated;
