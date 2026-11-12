-- Allow a user to purchase a virtual gift for their own collection.
-- The transfer and debit still happen atomically inside the trusted SECURITY DEFINER function.
create or replace function private.send_virtual_gift_impl(recipient uuid, gift_key text)
returns integer language plpgsql security definer
set search_path to 'public', 'auth'
as $$
declare me uuid:=auth.uid(); price integer; bal integer;
begin
 if me is null then raise exception 'Authentication required'; end if;
 if recipient is null then raise exception 'Choose a recipient'; end if;
 perform pg_advisory_xact_lock(hashtext(me::text));
 select price_xion into price from public.gift_catalog where id=gift_key;
 if price is null then raise exception 'Gift not found'; end if;
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 if bal<price then raise exception 'Not enough points'; end if;
 insert into public.gift_transfers(sender_id,recipient_id,gift_id) values(me,recipient,gift_key);
 if price>0 then insert into public.xion_ledger(user_id,amount,reason) values(me,-price,'gift_sent:'||gift_key); end if;
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 return bal;
end;
$$;
