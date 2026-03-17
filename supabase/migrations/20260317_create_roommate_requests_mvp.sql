alter table public.renter_profiles
add column if not exists is_published boolean not null default false;

update public.renter_profiles
set is_published = coalesce(is_roommate_profile_public, false)
where is_published = false
  and coalesce(is_roommate_profile_public, false) = true;

drop policy if exists "Renters can view own or public roommate profiles" on public.renter_profiles;
create policy "Renters can view own or published roommate profiles"
  on public.renter_profiles
  for select
  to authenticated
  using (auth.uid() = id or is_published = true);

create table if not exists public.roommate_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.renter_profiles(id) on delete cascade,
  receiver_id uuid not null references public.renter_profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create unique index if not exists idx_roommate_requests_unique_pair
  on public.roommate_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id));

alter table public.roommate_requests enable row level security;

drop policy if exists "Renters can view own roommate requests" on public.roommate_requests;
create policy "Renters can view own roommate requests"
  on public.roommate_requests
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Renters can send roommate requests" on public.roommate_requests;
create policy "Renters can send roommate requests"
  on public.roommate_requests
  for insert
  to authenticated
  with check (auth.uid() = sender_id and sender_id <> receiver_id);

drop policy if exists "Receivers can respond to roommate requests" on public.roommate_requests;
create policy "Receivers can respond to roommate requests"
  on public.roommate_requests
  for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (
    auth.uid() = receiver_id
    and status in ('accepted', 'rejected')
  );

grant select, insert, update on table public.roommate_requests to authenticated;

drop trigger if exists set_roommate_requests_updated_at on public.roommate_requests;
create trigger set_roommate_requests_updated_at
before update on public.roommate_requests
for each row execute function public.set_updated_at();

create or replace function public.create_or_get_roommate_conversation(
  p_other_renter_id uuid
)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_first_id uuid;
  v_second_id uuid;
  v_first_username text;
  v_second_username text;
  v_conversation public.conversations;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_user_id = p_other_renter_id then
    raise exception 'Cannot create a roommate conversation with yourself';
  end if;

  if not exists (
    select 1
    from public.roommate_requests rr
    where least(rr.sender_id, rr.receiver_id) = least(v_user_id, p_other_renter_id)
      and greatest(rr.sender_id, rr.receiver_id) = greatest(v_user_id, p_other_renter_id)
      and rr.status = 'accepted'
  ) then
    raise exception 'Roommate request must be accepted before chatting';
  end if;

  if v_user_id < p_other_renter_id then
    v_first_id := v_user_id;
    v_second_id := p_other_renter_id;
  else
    v_first_id := p_other_renter_id;
    v_second_id := v_user_id;
  end if;

  select username into v_first_username from public.profiles where id = v_first_id and role = 'renter';
  select username into v_second_username from public.profiles where id = v_second_id and role = 'renter';

  if v_first_username is null or v_second_username is null then
    raise exception 'Both users must be renter profiles';
  end if;

  select *
  into v_conversation
  from public.conversations c
  where c.renter_id = v_first_id
    and c.landlord_id = v_second_id
    and c.listing_id is null
  limit 1;

  if v_conversation.id is null then
    insert into public.conversations (
      renter_id,
      landlord_id,
      listing_id,
      renter_username,
      landlord_username
    )
    values (
      v_first_id,
      v_second_id,
      null,
      v_first_username,
      v_second_username
    )
    returning * into v_conversation;
  end if;

  return v_conversation;
end;
$$;

grant execute on function public.create_or_get_roommate_conversation(uuid) to authenticated;
