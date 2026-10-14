-- Shared, server-only guest rate windows. No IP addresses or conversation content.
create table if not exists public.storylove_guest_limits (
  guest_key text primary key,
  minute_start timestamptz not null default now(),
  minute_requests integer not null default 0,
  day_start date not null default current_date,
  day_requests integer not null default 0
);
alter table public.storylove_guest_limits enable row level security;
revoke all on public.storylove_guest_limits from public, anon, authenticated;
grant select, insert, update, delete on public.storylove_guest_limits to service_role;
create or replace function public.storylove_guest_chat_limit(p_key text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare m integer; d integer;
begin
  if p_key !~ '^[a-f0-9]{64}$' then return false; end if;
  insert into public.storylove_guest_limits(guest_key) values(p_key) on conflict do nothing;
  update public.storylove_guest_limits
  set minute_requests = case when minute_start <= now() - interval '60 seconds' then 1 else minute_requests + 1 end,
      minute_start = case when minute_start <= now() - interval '60 seconds' then now() else minute_start end,
      day_requests = case when day_start < current_date then 1 else day_requests + 1 end,
      day_start = current_date
  where guest_key = p_key returning minute_requests, day_requests into m, d;
  delete from public.storylove_guest_limits where day_start < current_date - 2;
  return m <= 8 and d <= 100;
end;
$$;
revoke all on function public.storylove_guest_chat_limit(text) from public, anon, authenticated;
grant execute on function public.storylove_guest_chat_limit(text) to service_role;
