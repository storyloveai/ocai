-- New approved credit tiers. Existing historical ledger entries are preserved.
create or replace function public.storylove_purchase(p_user uuid,p_session text,p_credits integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare inserted integer;
begin
 if p_credits not in (200,2500,5000) then raise exception 'Invalid pack';end if;
 insert into storylove_wallets(user_id) values(p_user) on conflict do nothing;
 perform 1 from storylove_wallets where user_id=p_user for update;
 insert into storylove_ledger(user_id,kind,delta,reference) values(p_user,'purchase',p_credits,'stripe:'||p_session) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then update storylove_wallets set balance=balance+p_credits where user_id=p_user;end if;
 return storylove_wallet(p_user);
end $$;
