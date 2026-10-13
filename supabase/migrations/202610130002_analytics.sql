-- Optional on Netlify (native Blobs is used there); required for Vercel event storage.
create table public.storylove_events(id uuid primary key,session_id uuid not null,name text not null,timestamp bigint not null,properties jsonb not null default '{}',environment text not null,source text not null,received_at timestamptz not null default now());
create index storylove_events_time on public.storylove_events(timestamp);
alter table public.storylove_events enable row level security;
revoke all on public.storylove_events from public,anon,authenticated;
create function public.storylove_ingest_events(p_events jsonb) returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 if jsonb_array_length(p_events)>20 then raise exception 'Batch too large';end if;
 insert into storylove_events(id,session_id,name,timestamp,properties,environment,source,received_at) select id::uuid,session_id::uuid,name,timestamp,properties,environment,source,received_at::timestamptz from jsonb_to_recordset(p_events) as x(id text,session_id text,name text,timestamp bigint,properties jsonb,environment text,source text,received_at text) on conflict(id) do nothing;
 get diagnostics n=row_count;return n;
end $$;
create function public.storylove_read_events(p_days integer,p_limit integer) returns jsonb language sql security definer set search_path=public as $$
 select coalesce(jsonb_agg(x),'[]'::jsonb) from (select id,session_id,name,timestamp,properties,environment,source,received_at from storylove_events where timestamp>=extract(epoch from (now()-make_interval(days=>least(greatest(p_days,1),30))))*1000 order by timestamp limit least(greatest(p_limit,1),20000)) x;
$$;
revoke all on function public.storylove_ingest_events(jsonb),public.storylove_read_events(integer,integer) from public,anon,authenticated;
grant execute on function public.storylove_ingest_events(jsonb),public.storylove_read_events(integer,integer) to service_role;
