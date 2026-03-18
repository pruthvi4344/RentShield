alter table public.roommate_requests
drop constraint if exists roommate_requests_status_check;

alter table public.roommate_requests
add constraint roommate_requests_status_check
check (status in ('pending', 'accepted', 'rejected', 'expired'));

alter table public.roommate_requests
add column if not exists rejected_at timestamptz;

alter table public.roommate_requests
add column if not exists expires_at timestamptz;

update public.roommate_requests
set expires_at = coalesce(expires_at, created_at + interval '7 days');

create or replace function public.expire_roommate_requests()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows bigint := 0;
begin
  update public.roommate_requests
  set status = 'expired',
      updated_at = now()
  where status = 'pending'
    and expires_at is not null
    and expires_at <= now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.sync_roommate_request_metadata()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.expires_at := coalesce(new.expires_at, now() + interval '7 days');
  end if;

  if new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.rejected_at := now();
  end if;

  if new.status = 'pending' and old.status is distinct from 'pending' then
    new.rejected_at := null;
    new.expires_at := coalesce(new.expires_at, now() + interval '7 days');
  end if;

  if new.status = 'accepted' then
    new.rejected_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_roommate_request_metadata on public.roommate_requests;
create trigger sync_roommate_request_metadata
before insert or update on public.roommate_requests
for each row execute function public.sync_roommate_request_metadata();

create or replace function public.send_roommate_request(
  p_receiver_id uuid
)
returns public.roommate_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_existing public.roommate_requests;
  v_daily_count integer;
  v_result public.roommate_requests;
begin
  if v_sender_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.expire_roommate_requests();

  if v_sender_id = p_receiver_id then
    raise exception 'You cannot send a roommate request to yourself.';
  end if;

  if not exists (
    select 1
    from public.renter_profiles
    where id = p_receiver_id
      and is_published = true
  ) then
    raise exception 'This roommate profile is not available.';
  end if;

  select count(*)
  into v_daily_count
  from public.roommate_requests
  where sender_id = v_sender_id
    and created_at >= now() - interval '24 hours';

  if v_daily_count >= 10 then
    raise exception 'You’ve reached your daily request limit. Try again tomorrow.';
  end if;

  select *
  into v_existing
  from public.roommate_requests
  where least(sender_id, receiver_id) = least(v_sender_id, p_receiver_id)
    and greatest(sender_id, receiver_id) = greatest(v_sender_id, p_receiver_id)
  limit 1;

  if v_existing.id is not null then
    if v_existing.status = 'accepted' then
      raise exception 'You are already matched with this roommate.';
    end if;

    if v_existing.status = 'pending' then
      raise exception 'A roommate request is already pending.';
    end if;

    if v_existing.status = 'rejected'
      and v_existing.rejected_at is not null
      and now() < v_existing.rejected_at + interval '48 hours' then
      raise exception 'You can send another request after 48 hours';
    end if;

    update public.roommate_requests
    set sender_id = v_sender_id,
        receiver_id = p_receiver_id,
        status = 'pending',
        created_at = now(),
        updated_at = now(),
        expires_at = now() + interval '7 days',
        rejected_at = null
    where id = v_existing.id
    returning * into v_result;

    return v_result;
  end if;

  insert into public.roommate_requests (
    sender_id,
    receiver_id,
    status,
    expires_at
  )
  values (
    v_sender_id,
    p_receiver_id,
    'pending',
    now() + interval '7 days'
  )
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.respond_roommate_request(
  p_request_id uuid,
  p_status text
)
returns public.roommate_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.roommate_requests;
  v_result public.roommate_requests;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_status not in ('accepted', 'rejected') then
    raise exception 'Invalid response status';
  end if;

  perform public.expire_roommate_requests();

  select *
  into v_request
  from public.roommate_requests
  where id = p_request_id
    and receiver_id = v_user_id
  limit 1;

  if v_request.id is null then
    raise exception 'Request not found';
  end if;

  if v_request.status = 'expired' or (v_request.status = 'pending' and v_request.expires_at <= now()) then
    update public.roommate_requests
    set status = 'expired',
        updated_at = now()
    where id = p_request_id
    returning * into v_result;

    raise exception 'Request expired';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This request can no longer be updated.';
  end if;

  update public.roommate_requests
  set status = p_status,
      updated_at = now()
  where id = p_request_id
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.expire_roommate_requests() to authenticated;
grant execute on function public.send_roommate_request(uuid) to authenticated;
grant execute on function public.respond_roommate_request(uuid, text) to authenticated;
