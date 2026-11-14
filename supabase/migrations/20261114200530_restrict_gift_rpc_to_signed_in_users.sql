revoke execute on function public.buy_gift_for_self(text) from public, anon;
grant execute on function public.buy_gift_for_self(text) to authenticated;
revoke execute on function public.sell_owned_gift(uuid) from public, anon;
grant execute on function public.sell_owned_gift(uuid) to authenticated;