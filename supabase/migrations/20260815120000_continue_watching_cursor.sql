-- Return one most-recent incomplete row per title. Cursor pagination keeps the
-- home rail bounded without hiding titles behind many episode-level rows.
create or replace function public.get_continue_watching_page(
  p_limit integer default 24,
  p_cursor_updated_at timestamp with time zone default null,
  p_cursor_id bigint default null
)
returns setof public.histories
language sql
stable
security invoker
set search_path = ''
as $$
  with latest_per_title as (
    select distinct on (h.type, h.media_id) h.*
    from public.histories h
    where h.user_id = (select auth.uid())
      and h.completed = false
    order by h.type, h.media_id, h.updated_at desc, h.id desc
  )
  select latest_per_title.*
  from latest_per_title
  where p_cursor_updated_at is null
     or latest_per_title.updated_at < p_cursor_updated_at
     or (
       latest_per_title.updated_at = p_cursor_updated_at
       and latest_per_title.id < p_cursor_id
     )
  order by latest_per_title.updated_at desc, latest_per_title.id desc
  limit greatest(1, least(coalesce(p_limit, 24), 50));
$$;

revoke all on function public.get_continue_watching_page(integer, timestamp with time zone, bigint)
from public;

grant execute on function public.get_continue_watching_page(integer, timestamp with time zone, bigint)
to authenticated;

create index if not exists histories_continue_watching_idx
on public.histories (user_id, completed, updated_at desc, id desc);
