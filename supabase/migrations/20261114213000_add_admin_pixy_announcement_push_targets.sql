create or replace function public.get_push_targets_for_announcement()
returns setof jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select ps.subscription
  from public.push_subscriptions ps
  where exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.username = 'anpro777'
  );
$$;

revoke all on function public.get_push_targets_for_announcement() from public, anon;
grant execute on function public.get_push_targets_for_announcement() to authenticated;
