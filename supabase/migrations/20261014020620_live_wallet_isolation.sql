-- Separate live balances from historical sandbox balances, sharing only auth identity.
create schema storylove_live;
revoke all on schema storylove_live from public, anon, authenticated;
grant usage on schema storylove_live to service_role;
create table storylove_live.wallets(user_id uuid primary key references auth.users(id) on delete cascade, balance bigint not null default 0 check(balance>=0));
create table storylove_live.ledger(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,kind text not null,delta bigint not null,reference text not null unique,created_at timestamptz not null default now());
alter table storylove_live.wallets enable row level security;
alter table storylove_live.ledger enable row level security;


revoke all on storylove_live.wallets,storylove_live.ledger from anon,authenticated;
revoke all on storylove_live.wallets,storylove_live.ledger from public;
grant all on storylove_live.wallets,storylove_live.ledger to service_role;
grant usage, select on all sequences in schema storylove_live to service_role;
create index ledger_user_recent_idx on storylove_live.ledger(user_id,id desc);
create function public.storylove_live_wallet(p_user uuid) returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare result jsonb;
begin
 insert into storylove_live.wallets(user_id) values(p_user) on conflict do nothing;
 select jsonb_build_object('balance',balance,'checked',exists(select 1 from storylove_live.ledger where reference='checkin:'||p_user||':'||(now() at time zone 'Asia/Shanghai')::date),'history',coalesce((select jsonb_agg(x) from (select kind,delta,created_at from storylove_live.ledger where user_id=p_user order by id desc limit 50)x),'[]'::jsonb)) into result from storylove_live.wallets where user_id=p_user;
 return result;
end $$;
create function public.storylove_live_checkin(p_user uuid) returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare inserted integer;
begin
 insert into storylove_live.wallets(user_id) values(p_user) on conflict do nothing;
 perform 1 from storylove_live.wallets where user_id=p_user for update;
 insert into storylove_live.ledger(user_id,kind,delta,reference) values(p_user,'checkin',100,'checkin:'||p_user||':'||(now() at time zone 'Asia/Shanghai')::date) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then update storylove_live.wallets set balance=balance+100 where user_id=p_user;end if;
 return public.storylove_live_wallet(p_user)||jsonb_build_object('claimed',inserted=1);
end $$;
create function public.storylove_live_purchase(p_user uuid,p_session text,p_credits integer) returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare inserted integer;
begin
 if p_session is null or p_session !~ '^cs_live_[A-Za-z0-9]+$' then raise exception 'Live session required';end if;
 if p_credits is null or p_credits not in (200,2500,5000) then raise exception 'Invalid pack';end if;
 insert into storylove_live.wallets(user_id) values(p_user) on conflict do nothing;
 perform 1 from storylove_live.wallets where user_id=p_user for update;
 insert into storylove_live.ledger(user_id,kind,delta,reference) values(p_user,'purchase',p_credits,'stripe:'||p_session) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then update storylove_live.wallets set balance=balance+p_credits where user_id=p_user;end if;
 return public.storylove_live_wallet(p_user);
end $$;
revoke all on function public.storylove_live_wallet(uuid),public.storylove_live_checkin(uuid),public.storylove_live_purchase(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.storylove_live_wallet(uuid),public.storylove_live_checkin(uuid),public.storylove_live_purchase(uuid,text,integer) to service_role;

create function public.storylove_live_purchase_status(p_user uuid,p_session text)
returns boolean language sql stable security invoker set search_path=pg_catalog as $$
 select exists(select 1 from storylove_live.ledger where user_id=p_user and kind='purchase' and reference='stripe:'||p_session);
$$;
revoke all on function public.storylove_live_purchase_status(uuid,text) from public,anon,authenticated;
grant execute on function public.storylove_live_purchase_status(uuid,text) to service_role;
