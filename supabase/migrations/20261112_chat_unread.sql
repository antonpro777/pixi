-- PIXY: per-user read markers for direct messages
alter table public.conversation_members
  add column if not exists last_read_at timestamptz not null default now();
create index if not exists messages_unread_lookup_idx
  on public.messages(conversation_id, sender_id, created_at desc);
drop policy if exists "Users can update their own conversation read marker" on public.conversation_members;
create policy "Users can update their own conversation read marker"
  on public.conversation_members for update to authenticated
  using (user_id=(select auth.uid()))
  with check (user_id=(select auth.uid()));
grant update(last_read_at) on public.conversation_members to authenticated;
