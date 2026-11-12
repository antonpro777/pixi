create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists "Users manage their own push subscriptions" on public.push_subscriptions;
create policy "Users manage their own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function public.get_push_targets_for_invite(p_invite_id uuid)
returns setof jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select ps.subscription
  from public.call_invites ci
  join public.push_subscriptions ps on ps.user_id = ci.callee_id
  where ci.id = p_invite_id
    and ci.caller_id = auth.uid()
    and auth.uid() is not null
    and ci.created_at > now() - interval '2 minutes';
$$;

revoke all on function public.get_push_targets_for_invite(uuid) from public, anon;
grant execute on function public.get_push_targets_for_invite(uuid) to authenticated;
