create table if not exists public.renter_saved_listings (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid not null references public.renter_profiles(id) on delete cascade,
  listing_id uuid not null references public.landlord_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (renter_id, listing_id)
);

create index if not exists idx_renter_saved_listings_renter_created
  on public.renter_saved_listings (renter_id, created_at desc);

alter table public.renter_saved_listings enable row level security;

drop policy if exists "Renter can view own saved listings" on public.renter_saved_listings;
create policy "Renter can view own saved listings"
  on public.renter_saved_listings
  for select
  using (auth.uid() = renter_id);

drop policy if exists "Renter can insert own saved listings" on public.renter_saved_listings;
create policy "Renter can insert own saved listings"
  on public.renter_saved_listings
  for insert
  with check (auth.uid() = renter_id);

drop policy if exists "Renter can delete own saved listings" on public.renter_saved_listings;
create policy "Renter can delete own saved listings"
  on public.renter_saved_listings
  for delete
  using (auth.uid() = renter_id);

grant select, insert, delete on table public.renter_saved_listings to authenticated;
