create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
alter table public.post_likes enable row level security;
drop policy if exists "Likes are visible" on public.post_likes;
create policy "Likes are visible" on public.post_likes for select to authenticated using (true);
drop policy if exists "Users like accessible posts" on public.post_likes;
create policy "Users like accessible posts" on public.post_likes for insert to authenticated
with check (
  user_id=(select auth.uid())
  and private.pixy_can_perform((select auth.uid()),'reactions')
  and exists(select 1 from public.posts p where p.id=post_likes.post_id and ((p.visibility='public') or p.author_id=(select auth.uid())))
);
drop policy if exists "Users remove their own likes" on public.post_likes;
create policy "Users remove their own likes" on public.post_likes for delete to authenticated
using (user_id=(select auth.uid()));
grant select,insert,delete on public.post_likes to authenticated;

insert into public.post_likes(post_id,user_id,created_at)
select post_id,user_id,created_at from public.reactions where reaction='like'
on conflict(post_id,user_id) do nothing;
delete from public.reactions where reaction='like';

alter table public.reactions drop constraint if exists reactions_reaction_check;
alter table public.reactions add constraint reactions_reaction_check
check (reaction = any (array['heart','dislike','clown','sick','star_eyes','cool']::text[]));

drop trigger if exists reactions_award_xion on public.reactions;
create or replace function private.award_xion_for_post_like()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_author uuid;
  claim_id uuid;
begin
  select author_id into post_author from public.posts where id=new.post_id;
  if post_author is not null and post_author<>new.user_id then
    insert into public.xion_reward_claims(reward_type,actor_id,recipient_id,source_id)
    values('like',new.user_id,post_author,new.post_id)
    on conflict(reward_type,actor_id,source_id) do nothing
    returning id into claim_id;
    if claim_id is not null then
      insert into public.xion_ledger(user_id,amount,reason,reference_id)
      values(post_author,5,'like_reward',claim_id);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists post_likes_award_xion on public.post_likes;
create trigger post_likes_award_xion after insert on public.post_likes
for each row execute function private.award_xion_for_post_like();

drop policy if exists "Users react on accessible posts" on public.reactions;
create policy "Users react on accessible posts" on public.reactions
for insert to authenticated
with check (
  user_id=(select auth.uid())
  and private.pixy_can_perform((select auth.uid()),'reactions')
  and exists(select 1 from public.profiles self where self.id=(select auth.uid()) and self.reactions_enabled)
  and exists(
    select 1 from public.posts p join public.profiles author on author.id=p.author_id
    where p.id=reactions.post_id and author.reactions_enabled
      and ((p.visibility='public') or p.author_id=(select auth.uid()))
  )
);
drop policy if exists "Users update reactions on accessible posts" on public.reactions;
create policy "Users update reactions on accessible posts" on public.reactions
for update to authenticated
using (user_id=(select auth.uid()) and private.pixy_can_perform((select auth.uid()),'reactions'))
with check (
  user_id=(select auth.uid())
  and private.pixy_can_perform((select auth.uid()),'reactions')
  and exists(select 1 from public.profiles self where self.id=(select auth.uid()) and self.reactions_enabled)
  and exists(
    select 1 from public.posts p join public.profiles author on author.id=p.author_id
    where p.id=reactions.post_id and author.reactions_enabled
      and ((p.visibility='public') or p.author_id=(select auth.uid()))
  )
);

revoke all on function public.award_xion_for_like() from public, anon, authenticated;
