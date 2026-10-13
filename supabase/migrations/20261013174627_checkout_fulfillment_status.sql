-- Applied to the dedicated StoryLove sandbox; additive, does not modify balances.
create index if not exists storylove_ledger_user_recent_idx on public.storylove_ledger(user_id,id desc);
create or replace function public.storylove_purchase_status(p_user uuid,p_session text)
returns boolean language sql stable security invoker set search_path=public as $$
 select exists(select 1 from public.storylove_ledger where user_id=p_user and kind='purchase' and reference='stripe:'||p_session);
$$;
revoke all on function public.storylove_purchase_status(uuid,text) from public,anon,authenticated;
grant execute on function public.storylove_purchase_status(uuid,text) to service_role;
