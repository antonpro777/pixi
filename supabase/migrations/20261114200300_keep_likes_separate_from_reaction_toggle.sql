drop policy if exists "Users react on accessible posts" on public.reactions;
create policy "Users react on accessible posts" on public.reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.pixy_can_perform((select auth.uid()), 'reactions')
  and exists(
    select 1 from public.posts p
    join public.profiles author on author.id=p.author_id
    where p.id=reactions.post_id
      and ((p.visibility='public') or (p.author_id=(select auth.uid())))
      and (
        reactions.reaction='like'
        or (
          author.reactions_enabled
          and exists(select 1 from public.profiles self where self.id=(select auth.uid()) and self.reactions_enabled)
        )
      )
  )
);
drop policy if exists "Users update reactions on accessible posts" on public.reactions;
create policy "Users update reactions on accessible posts" on public.reactions
for update to authenticated
using (user_id=(select auth.uid()) and private.pixy_can_perform((select auth.uid()),'reactions'))
with check (
  user_id=(select auth.uid())
  and private.pixy_can_perform((select auth.uid()),'reactions')
  and exists(
    select 1 from public.posts p
    join public.profiles author on author.id=p.author_id
    where p.id=reactions.post_id
      and ((p.visibility='public') or (p.author_id=(select auth.uid())))
      and (
        reactions.reaction='like'
        or (
          author.reactions_enabled
          and exists(select 1 from public.profiles self where self.id=(select auth.uid()) and self.reactions_enabled)
        )
      )
  )
);