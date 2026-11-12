create table if not exists public.xion_reward_claims (
  id uuid primary key default gen_random_uuid(),
  reward_type text not null check (reward_type in ('like','follow')),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  source_id uuid not null,
  created_at timestamptz not null default now(),
  unique (reward_type, actor_id, source_id)
);

alter table public.xion_reward_claims enable row level security;
revoke all on public.xion_reward_claims from anon, authenticated;

create or replace function public.award_xion_for_like()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare post_author uuid; claim_id uuid;
begin
  if new.reaction <> 'like' then return new; end if;
  if tg_op = 'UPDATE' and old.reaction = 'like' then return new; end if;
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into public.xion_reward_claims(reward_type,actor_id,recipient_id,source_id)
    values ('like',new.user_id,post_author,new.post_id)
    on conflict (reward_type,actor_id,source_id) do nothing returning id into claim_id;
    if claim_id is not null then
      insert into public.xion_ledger(user_id,amount,reason,reference_id)
      values (post_author,5,'like_reward',claim_id);
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.award_xion_for_follow()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare claim_id uuid;
begin
  if new.follower_id <> new.following_id then
    insert into public.xion_reward_claims(reward_type,actor_id,recipient_id,source_id)
    values ('follow',new.follower_id,new.following_id,new.following_id)
    on conflict (reward_type,actor_id,source_id) do nothing returning id into claim_id;
    if claim_id is not null then
      insert into public.xion_ledger(user_id,amount,reason,reference_id)
      values (new.following_id,8,'follow_reward',claim_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reactions_award_xion on public.reactions;
create trigger reactions_award_xion
after insert or update of reaction on public.reactions
for each row execute function public.award_xion_for_like();

drop trigger if exists follows_award_xion on public.follows;
create trigger follows_award_xion
after insert on public.follows
for each row execute function public.award_xion_for_follow();