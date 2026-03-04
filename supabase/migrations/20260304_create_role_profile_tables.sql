create table if not exists public.renter_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  university text,
  city text,
  move_in_date date,
  budget_min integer,
  budget_max integer,
  lifestyle text[] default '{}'::text[],
  bio text,
  room_preference text,
  gender text,
  country text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.landlord_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  phone text,
  city text,
  bio text,
  business_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.renter_profiles enable row level security;
alter table public.landlord_profiles enable row level security;

drop policy if exists "Renter can view own profile" on public.renter_profiles;
create policy "Renter can view own profile"
  on public.renter_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Renter can insert own profile" on public.renter_profiles;
create policy "Renter can insert own profile"
  on public.renter_profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Renter can update own profile" on public.renter_profiles;
create policy "Renter can update own profile"
  on public.renter_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Landlord can view own profile" on public.landlord_profiles;
create policy "Landlord can view own profile"
  on public.landlord_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Landlord can insert own profile" on public.landlord_profiles;
create policy "Landlord can insert own profile"
  on public.landlord_profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Landlord can update own profile" on public.landlord_profiles;
create policy "Landlord can update own profile"
  on public.landlord_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on table public.renter_profiles to authenticated;
grant select, insert, update on table public.landlord_profiles to authenticated;

drop trigger if exists set_renter_profiles_updated_at on public.renter_profiles;
create trigger set_renter_profiles_updated_at
before update on public.renter_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_landlord_profiles_updated_at on public.landlord_profiles;
create trigger set_landlord_profiles_updated_at
before update on public.landlord_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_role_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data ->> 'role', 'renter');

  if user_role = 'landlord' then
    insert into public.landlord_profiles (id, email, username)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
    )
    on conflict (id) do update
    set email = excluded.email,
        username = excluded.username,
        updated_at = now();
  else
    insert into public.renter_profiles (id, email, username)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
    )
    on conflict (id) do update
    set email = excluded.email,
        username = excluded.username,
        updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role_profiles on auth.users;
create trigger on_auth_user_created_role_profiles
after insert on auth.users
for each row execute procedure public.handle_new_user_role_profiles();

insert into public.renter_profiles (id, email, username)
select p.id, p.email, p.username
from public.profiles p
where p.role = 'renter'
on conflict (id) do update
set email = excluded.email,
    username = excluded.username,
    updated_at = now();

insert into public.landlord_profiles (id, email, username)
select p.id, p.email, p.username
from public.profiles p
where p.role = 'landlord'
on conflict (id) do update
set email = excluded.email,
    username = excluded.username,
    updated_at = now();
