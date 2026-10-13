-- Run once in Supabase SQL Editor. All mutations are service-role RPC only.
create table public.storylove_wallets(user_id uuid primary key references auth.users(id) on delete cascade, balance bigint not null default 0 check(balance>=0));
create table public.storylove_ledger(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,kind text not null,delta bigint not null,reference text not null unique,created_at timestamptz not null default now());
alter table public.storylove_wallets enable row level security;
alter table public.storylove_ledger enable row level security;
create policy own_wallet on public.storylove_wallets for select to authenticated using(auth.uid()=user_id);
create policy own_ledger on public.storylove_ledger for select to authenticated using(auth.uid()=user_id);
revoke all on public.storylove_wallets,public.storylove_ledger from anon,authenticated;
grant select on public.storylove_wallets,public.storylove_ledger to authenticated;
create function public.storylove_wallet(p_user uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
 insert into storylove_wallets(user_id) values(p_user) on conflict do nothing;
 select jsonb_build_object('balance',balance,'checked',exists(select 1 from storylove_ledger where reference='checkin:'||p_user||':'||(now() at time zone 'Asia/Shanghai')::date),'history',coalesce((select jsonb_agg(x) from (select kind,delta,created_at from storylove_ledger where user_id=p_user order by id desc limit 50)x),'[]'::jsonb)) into result from storylove_wallets where user_id=p_user;
 return result;
end $$;
create function public.storylove_checkin(p_user uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare inserted integer;
begin
 insert into storylove_wallets(user_id) values(p_user) on conflict do nothing;
 perform 1 from storylove_wallets where user_id=p_user for update;
 insert into storylove_ledger(user_id,kind,delta,reference) values(p_user,'checkin',100,'checkin:'||p_user||':'||(now() at time zone 'Asia/Shanghai')::date) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then update storylove_wallets set balance=balance+100 where user_id=p_user;end if;
 return storylove_wallet(p_user)||jsonb_build_object('claimed',inserted=1);
end $$;
create function public.storylove_purchase(p_user uuid,p_session text,p_credits integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare inserted integer;
begin
 if p_credits not in (1000,5500,12000) then raise exception 'Invalid pack';end if;
 insert into storylove_wallets(user_id) values(p_user) on conflict do nothing;
 perform 1 from storylove_wallets where user_id=p_user for update;
 insert into storylove_ledger(user_id,kind,delta,reference) values(p_user,'purchase',p_credits,'stripe:'||p_session) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then update storylove_wallets set balance=balance+p_credits where user_id=p_user;end if;
 return storylove_wallet(p_user);
end $$;
revoke all on function public.storylove_wallet(uuid),public.storylove_checkin(uuid),public.storylove_purchase(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.storylove_wallet(uuid),public.storylove_checkin(uuid),public.storylove_purchase(uuid,text,integer) to service_role;
-- Shared across function instances; no process-local rate counters.
create table public.storylove_chat_limits(user_id uuid primary key references auth.users(id) on delete cascade,window_start timestamptz not null default now(),requests integer not null default 0);
alter table public.storylove_chat_limits enable row level security;
revoke all on public.storylove_chat_limits from public,anon,authenticated;
create function public.storylove_chat_limit(p_user uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 insert into storylove_chat_limits(user_id) values(p_user) on conflict do nothing;
 update storylove_chat_limits set requests=case when window_start<=now()-interval '60 seconds' then 1 else requests+1 end,window_start=case when window_start<=now()-interval '60 seconds' then now() else window_start end where user_id=p_user returning requests into n;
 return n<=8;
end $$;
revoke all on function public.storylove_chat_limit(uuid) from public,anon,authenticated;
grant execute on function public.storylove_chat_limit(uuid) to service_role;
