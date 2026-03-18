create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'listing_saved',
      'message_received',
      'verification_approved',
      'roommate_request_received',
      'roommate_request_accepted',
      'roommate_request_rejected',
      'roommate_request_expired'
    )
  ),
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activities_user_created
  on public.user_activities (user_id, created_at desc);

alter table public.user_activities enable row level security;

drop policy if exists "Users can view own activities" on public.user_activities;
create policy "Users can view own activities"
  on public.user_activities
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.user_activities to authenticated;

create or replace function public.create_user_activity(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_title is null or btrim(p_title) = '' then
    return;
  end if;

  insert into public.user_activities (user_id, type, title, metadata)
  values (p_user_id, p_type, p_title, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.create_user_activity(uuid, text, text, jsonb) to authenticated;

create or replace function public.handle_saved_listing_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city text;
  v_listing_title text;
begin
  select city, title
  into v_city, v_listing_title
  from public.landlord_listings
  where id = new.listing_id;

  perform public.create_user_activity(
    new.renter_id,
    'listing_saved',
    format('You saved a listing in %s', coalesce(v_city, 'your area')),
    jsonb_build_object(
      'listing_id', new.listing_id,
      'title', v_listing_title,
      'city', v_city
    )
  );

  return new;
end;
$$;

drop trigger if exists create_saved_listing_activity on public.renter_saved_listings;
create trigger create_saved_listing_activity
after insert on public.renter_saved_listings
for each row execute function public.handle_saved_listing_activity();

create or replace function public.handle_message_received_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_renter_id uuid;
  v_other_id uuid;
  v_renter_username text;
  v_other_username text;
  v_receiver_id uuid;
  v_sender_name text;
begin
  select renter_id, landlord_id, renter_username, landlord_username
  into v_renter_id, v_other_id, v_renter_username, v_other_username
  from public.conversations
  where id = new.conversation_id;

  if not found then
    return new;
  end if;

  if new.sender_id = v_renter_id then
    v_receiver_id := v_other_id;
    v_sender_name := v_renter_username;
  else
    v_receiver_id := v_renter_id;
    v_sender_name := v_other_username;
  end if;

  perform public.create_user_activity(
    v_receiver_id,
    'message_received',
    format('%s sent you a message', coalesce(v_sender_name, 'Someone')),
    jsonb_build_object(
      'conversation_id', new.conversation_id,
      'message_id', new.id,
      'sender_id', new.sender_id,
      'sender_name', v_sender_name
    )
  );

  return new;
end;
$$;

drop trigger if exists create_message_received_activity on public.messages;
create trigger create_message_received_activity
after insert on public.messages
for each row execute function public.handle_message_received_activity();

create or replace function public.handle_renter_verification_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_verified = true and coalesce(old.is_verified, false) = false then
    perform public.create_user_activity(
      new.id,
      'verification_approved',
      'Your identity verification was approved',
      jsonb_build_object('profile_type', 'renter')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists create_renter_verification_activity on public.renter_profiles;
create trigger create_renter_verification_activity
after update of is_verified on public.renter_profiles
for each row execute function public.handle_renter_verification_activity();

create or replace function public.handle_roommate_request_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
  v_receiver_name text;
begin
  select username into v_sender_name from public.renter_profiles where id = new.sender_id;
  select username into v_receiver_name from public.renter_profiles where id = new.receiver_id;

  if tg_op = 'INSERT' then
    perform public.create_user_activity(
      new.receiver_id,
      'roommate_request_received',
      format('You received a roommate request from %s', coalesce(v_sender_name, 'a renter')),
      jsonb_build_object('request_id', new.id, 'sender_id', new.sender_id, 'sender_name', v_sender_name)
    );
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if new.status = 'accepted' then
    perform public.create_user_activity(
      new.sender_id,
      'roommate_request_accepted',
      format('%s accepted your roommate request', coalesce(v_receiver_name, 'A renter')),
      jsonb_build_object('request_id', new.id, 'receiver_id', new.receiver_id, 'receiver_name', v_receiver_name)
    );
  elsif new.status = 'rejected' then
    perform public.create_user_activity(
      new.sender_id,
      'roommate_request_rejected',
      format('%s rejected your roommate request', coalesce(v_receiver_name, 'A renter')),
      jsonb_build_object('request_id', new.id, 'receiver_id', new.receiver_id, 'receiver_name', v_receiver_name)
    );
  elsif new.status = 'expired' then
    perform public.create_user_activity(
      new.sender_id,
      'roommate_request_expired',
      'Your roommate request expired',
      jsonb_build_object('request_id', new.id, 'receiver_id', new.receiver_id, 'receiver_name', v_receiver_name)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists create_roommate_request_activity on public.roommate_requests;
create trigger create_roommate_request_activity
after insert or update of status on public.roommate_requests
for each row execute function public.handle_roommate_request_activity();
