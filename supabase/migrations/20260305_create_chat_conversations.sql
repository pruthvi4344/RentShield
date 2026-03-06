create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid,
  renter_username text not null,
  landlord_username text not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (renter_id <> landlord_id)
);

create unique index if not exists idx_conversations_unique_pair_listing
  on public.conversations (renter_id, landlord_id, coalesce(listing_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists idx_conversations_renter_last_message
  on public.conversations (renter_id, last_message_at desc);

create index if not exists idx_conversations_landlord_last_message
  on public.conversations (landlord_id, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation_created
  on public.messages (conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
  on public.conversations
  for select
  to authenticated
  using (auth.uid() = renter_id or auth.uid() = landlord_id);

drop policy if exists "Participants can create conversations" on public.conversations;
create policy "Participants can create conversations"
  on public.conversations
  for insert
  to authenticated
  with check (auth.uid() = renter_id or auth.uid() = landlord_id);

drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.renter_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.renter_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );

grant select, insert on table public.conversations to authenticated;
grant select, insert on table public.messages to authenticated;

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists touch_conversation_on_message_insert on public.messages;
create trigger touch_conversation_on_message_insert
after insert on public.messages
for each row execute function public.touch_conversation_last_message();

create or replace function public.create_or_get_conversation(
  p_landlord_id uuid,
  p_listing_id uuid default null
)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_renter_username text;
  v_landlord_username text;
  v_renter_role text;
  v_conversation public.conversations;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select username, role
  into v_renter_username, v_renter_role
  from public.profiles
  where id = v_user_id;

  if v_renter_role is distinct from 'renter' then
    raise exception 'Only renters can start conversations from listings';
  end if;

  select username
  into v_landlord_username
  from public.profiles
  where id = p_landlord_id
    and role = 'landlord';

  if v_landlord_username is null then
    raise exception 'Landlord profile not found';
  end if;

  select *
  into v_conversation
  from public.conversations c
  where c.renter_id = v_user_id
    and c.landlord_id = p_landlord_id
    and c.listing_id is not distinct from p_listing_id
  limit 1;

  if v_conversation.id is null then
    begin
      insert into public.conversations (
        renter_id,
        landlord_id,
        listing_id,
        renter_username,
        landlord_username
      )
      values (
        v_user_id,
        p_landlord_id,
        p_listing_id,
        v_renter_username,
        v_landlord_username
      )
      returning * into v_conversation;
    exception
      when unique_violation then
        select *
        into v_conversation
        from public.conversations c
        where c.renter_id = v_user_id
          and c.landlord_id = p_landlord_id
          and c.listing_id is not distinct from p_listing_id
        limit 1;
    end;
  end if;

  return v_conversation;
end;
$$;

grant execute on function public.create_or_get_conversation(uuid, uuid) to authenticated;
