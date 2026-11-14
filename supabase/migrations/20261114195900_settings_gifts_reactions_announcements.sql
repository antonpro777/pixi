-- PIXY settings, independent heart reaction, collectible gifts and scheduled announcement
alter table public.profiles
  add column if not exists reactions_enabled boolean not null default true;

alter table public.reactions drop constraint if exists reactions_reaction_check;
alter table public.reactions
  add constraint reactions_reaction_check
  check (reaction = any (array['like','heart','dislike','clown','sick','star_eyes','cool']::text[]));

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark','light')),
  banner_mode text not null default 'rotate' check (banner_mode in ('rotate','original','music','off')),
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "Users read own PIXY settings" on public.user_settings;
create policy "Users read own PIXY settings" on public.user_settings for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users create own PIXY settings" on public.user_settings;
create policy "Users create own PIXY settings" on public.user_settings for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users update own PIXY settings" on public.user_settings;
create policy "Users update own PIXY settings" on public.user_settings for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update on public.user_settings to authenticated;

create table if not exists public.gift_inventory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  gift_id text not null references public.gift_catalog(id),
  purchase_price integer not null check (purchase_price >= 0),
  acquired_at timestamptz not null default now(),
  source_sender_id uuid references auth.users(id) on delete set null,
  source_transfer_id uuid unique references public.gift_transfers(id) on delete set null,
  sold_at timestamptz,
  sale_price integer
);
create index if not exists gift_inventory_owner_active_idx on public.gift_inventory(owner_id, acquired_at desc) where sold_at is null;
alter table public.gift_inventory enable row level security;
drop policy if exists "Users read their own gift inventory" on public.gift_inventory;
create policy "Users read their own gift inventory" on public.gift_inventory for select to authenticated using (owner_id = (select auth.uid()));
grant select on public.gift_inventory to authenticated;

create or replace function private.on_pixy_gift_transfer()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_price integer;
  v_title text;
  v_conversation uuid;
begin
  select price_xion, title into v_price, v_title
  from public.gift_catalog where id = new.gift_id;

  insert into public.gift_inventory(owner_id,gift_id,purchase_price,source_sender_id,source_transfer_id)
  values(new.recipient_id,new.gift_id,coalesce(v_price,0),new.sender_id,new.id)
  on conflict (source_transfer_id) do nothing;

  select c.id into v_conversation
  from public.conversations c
  join public.conversation_members a on a.conversation_id=c.id and a.user_id=new.sender_id
  join public.conversation_members b on b.conversation_id=c.id and b.user_id=new.recipient_id
  where (select count(*) from public.conversation_members m where m.conversation_id=c.id)=2
  order by c.created_at desc
  limit 1;

  if v_conversation is null then
    insert into public.conversations default values returning id into v_conversation;
    insert into public.conversation_members(conversation_id,user_id) values
      (v_conversation,new.sender_id),(v_conversation,new.recipient_id)
    on conflict do nothing;
  end if;

  insert into public.messages(conversation_id,sender_id,body)
  values(v_conversation,new.sender_id,
    '🎁 Подарок «'||coalesce(v_title,new.gift_id)||'» отправлен за '||coalesce(v_price,0)||' XION.');

  return new;
end;
$$;
drop trigger if exists pixy_gift_transfer_inventory_and_chat on public.gift_transfers;
create trigger pixy_gift_transfer_inventory_and_chat
after insert on public.gift_transfers
for each row execute function private.on_pixy_gift_transfer();

create or replace function public.buy_gift_for_self(gift_key text)
returns integer
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  me uuid := auth.uid();
  v_price integer;
  v_balance integer;
begin
  if me is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtext(me::text));
  select price_xion into v_price from public.gift_catalog where id=gift_key;
  if v_price is null then raise exception 'Gift not found'; end if;
  select coalesce(sum(amount),0) into v_balance from public.xion_ledger where user_id=me;
  if v_balance < v_price then raise exception 'Not enough points'; end if;
  insert into public.gift_inventory(owner_id,gift_id,purchase_price)
  values(me,gift_key,v_price);
  insert into public.xion_ledger(user_id,amount,reason)
  values(me,-v_price,'gift_purchase:'||gift_key);
  select coalesce(sum(amount),0) into v_balance from public.xion_ledger where user_id=me;
  return v_balance;
end;
$$;
revoke all on function public.buy_gift_for_self(text) from public;
grant execute on function public.buy_gift_for_self(text) to authenticated;

create or replace function public.sell_owned_gift(inventory_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  me uuid := auth.uid();
  v_item public.gift_inventory%rowtype;
  v_sale integer;
begin
  if me is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtext(me::text));
  select * into v_item from public.gift_inventory
  where id=inventory_id and owner_id=me and sold_at is null
  for update;
  if not found then raise exception 'Gift is not available for sale'; end if;
  v_sale := v_item.purchase_price + (floor(extract(epoch from (now()-v_item.acquired_at))/7200)::integer * 2);
  update public.gift_inventory set sold_at=now(),sale_price=v_sale where id=v_item.id;
  insert into public.xion_ledger(user_id,amount,reason,reference_id)
  values(me,v_sale,'gift_sold:'||v_item.gift_id,v_item.id);
  return v_sale;
end;
$$;
revoke all on function public.sell_owned_gift(uuid) from public;
grant execute on function public.sell_owned_gift(uuid) to authenticated;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  publish_at timestamptz not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "Users can read published PIXY announcements" on public.announcements;
create policy "Users can read published PIXY announcements" on public.announcements
for select to authenticated using (published_at is not null);
grant select on public.announcements to authenticated;

create or replace function public.publish_due_pixy_announcements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  update public.announcements
  set published_at=now()
  where published_at is null and publish_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.publish_due_pixy_announcements() from public;
grant execute on function public.publish_due_pixy_announcements() to anon, authenticated;

drop policy if exists "Users react on accessible posts" on public.reactions;
create policy "Users react on accessible posts" on public.reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.pixy_can_perform((select auth.uid()), 'reactions')
  and exists(select 1 from public.profiles self where self.id=(select auth.uid()) and self.reactions_enabled)
  and exists(
    select 1 from public.posts p
    join public.profiles author on author.id=p.author_id
    where p.id=reactions.post_id
      and author.reactions_enabled
      and ((p.visibility='public') or (p.author_id=(select auth.uid())))
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
  and exists(select 1 from public.posts p join public.profiles author on author.id=p.author_id where p.id=reactions.post_id and author.reactions_enabled and ((p.visibility='public') or (p.author_id=(select auth.uid()))))
);

insert into public.announcements(title,body,publish_at)
values('Новое обновление PIXY','В PIXY вышло новое обновление! Загляни в меню ···, чтобы посмотреть новые настройки, светлую тему и возможности.', '2026-11-14T17:05:00Z')
on conflict do nothing;
