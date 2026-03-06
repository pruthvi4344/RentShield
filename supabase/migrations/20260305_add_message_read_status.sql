alter table public.messages
add column if not exists read_at timestamptz;

create or replace function public.get_unread_counts()
returns table (conversation_id uuid, unread_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    m.conversation_id,
    count(*)::bigint as unread_count
  from public.messages m
  join public.conversations c
    on c.id = m.conversation_id
  where m.read_at is null
    and m.sender_id <> auth.uid()
    and (c.renter_id = auth.uid() or c.landlord_id = auth.uid())
  group by m.conversation_id;
$$;

create or replace function public.mark_conversation_as_read(p_conversation_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows bigint := 0;
begin
  update public.messages m
  set read_at = now()
  where m.conversation_id = p_conversation_id
    and m.read_at is null
    and m.sender_id <> auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = m.conversation_id
        and (c.renter_id = auth.uid() or c.landlord_id = auth.uid())
    );

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

grant execute on function public.get_unread_counts() to authenticated;
grant execute on function public.mark_conversation_as_read(uuid) to authenticated;
