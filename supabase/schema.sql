-- PIXY initial schema. Apply in the Supabase SQL editor or as a migration.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_.]{3,24}$'),
  display_name text not null default 'PIXY user' check (char_length(display_name) <= 40),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_url text,
  profile_background text not null default 'Aurora',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are visible to everyone" on public.profiles for select to anon, authenticated using (true);
create policy "Users create their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 2200),
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  created_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_author_id_idx on public.posts(author_id, created_at desc);
alter table public.posts enable row level security;
create policy "Public posts are readable" on public.posts for select to anon, authenticated using (
  visibility = 'public' or author_id = (select auth.uid())
);
create policy "Users publish as themselves" on public.posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users edit their own posts" on public.posts for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "Users delete their own posts" on public.posts for delete to authenticated using ((select auth.uid()) = author_id);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;
create policy "Follow lists are public" on public.follows for select to anon, authenticated using (true);
create policy "Users follow from their own account" on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "Users unfollow from their own account" on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like','dislike','clown','sick','star_eyes','cool')),
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);
alter table public.reactions enable row level security;
create policy "Reactions are visible" on public.reactions for select to anon, authenticated using (true);
create policy "Users react as themselves" on public.reactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users change their own reaction" on public.reactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users remove their own reaction" on public.reactions for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id,created_at);
alter table public.comments enable row level security;
create policy "Comments are visible with their post" on public.comments for select to anon, authenticated using (exists(select 1 from public.posts p where p.id=post_id and (p.visibility='public' or p.author_id=(select auth.uid()))));
create policy "Users comment as themselves" on public.comments for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users delete their own comments" on public.comments for delete to authenticated using ((select auth.uid()) = author_id);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
alter table public.stories enable row level security;
create policy "Unexpired stories are visible" on public.stories for select to anon, authenticated using (expires_at > now());
create policy "Users create their own stories" on public.stories for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users delete their own stories" on public.stories for delete to authenticated using ((select auth.uid()) = author_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(conversation_id,user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 4000),
  attachment_url text,
  attachment_type text check (attachment_type in ('image','audio','sticker') or attachment_type is null),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id,created_at);
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
create policy "Members can read their conversations" on public.conversations for select to authenticated using (exists(select 1 from public.conversation_members m where m.conversation_id=id and m.user_id=(select auth.uid())));
create policy "Users can read their own membership rows" on public.conversation_members for select to authenticated using (user_id=(select auth.uid()));
create policy "Members can read messages" on public.messages for select to authenticated using (exists(select 1 from public.conversation_members m where m.conversation_id=conversation_id and m.user_id=(select auth.uid())));
create policy "Members can send messages" on public.messages for insert to authenticated with check ((select auth.uid())=sender_id and exists(select 1 from public.conversation_members m where m.conversation_id=conversation_id and m.user_id=(select auth.uid())));

-- Wallet ledger is intentionally read-only to users. Reward issuance and purchases must be
-- performed by trusted server-side functions after anti-abuse validation, never by browser JS.
create table if not exists public.xion_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);
alter table public.xion_ledger enable row level security;
create policy "Users can read their own XION history" on public.xion_ledger for select to authenticated using ((select auth.uid())=user_id);

create table if not exists public.gift_catalog (
  id text primary key,
  title text not null,
  emoji text not null,
  price_xion integer not null check(price_xion between 15 and 200),
  sort_order integer not null unique
);
alter table public.gift_catalog enable row level security;
create policy "Gift catalog is public" on public.gift_catalog for select to anon, authenticated using (true);
insert into public.gift_catalog(id,title,emoji,price_xion,sort_order) values
('moon','Moon','🌙',15,1),('heart','Heart','💜',20,2),('planet','Planet','🪐',25,3),('teddy','Teddy','🧸',30,4),('bloom','Bloom','🌸',35,5),
('music','Music','🎧',45,6),('butterfly','Butterfly','🦋',55,7),('crystal','Crystal','💎',70,8),('cat','Cat','🐱',85,9),('ribbon','Ribbon','🎀',100,10),
('rocket','Rocket','🚀',120,11),('crown','Crown','👑',140,12),('unicorn','Unicorn','🦄',160,13),('trophy','Trophy','🏆',180,14),('stardust','Stardust','✨',200,15)
on conflict(id) do nothing;

create table if not exists public.profile_backgrounds (
  id text primary key,
  title text not null,
  price_xion integer not null check(price_xion >= 0),
  sort_order integer not null unique
);
alter table public.profile_backgrounds enable row level security;
create policy "Background catalog is public" on public.profile_backgrounds for select to anon, authenticated using (true);
insert into public.profile_backgrounds(id,title,price_xion,sort_order) values
('aurora','Aurora',0,1),('sunset','Sunset',30,2),('ocean','Ocean',45,3),('candy','Candy',55,4),('forest','Forest',65,5),
('cosmic','Cosmic',75,6),('peach','Peach',85,7),('lavender','Lavender',95,8),('neon','Neon',110,9),('silver','Silver',125,10)
on conflict(id) do nothing;

-- Public post media. The first storage path segment must be the authenticated user's UUID.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('pixy-media','pixy-media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/webm','audio/ogg'])
on conflict(id) do nothing;
create policy "Public can view PIXY media" on storage.objects for select to anon,authenticated using (bucket_id='pixy-media');
create policy "Users upload into their own PIXY folder" on storage.objects for insert to authenticated with check (bucket_id='pixy-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users update their own PIXY media" on storage.objects for update to authenticated using (bucket_id='pixy-media' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='pixy-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users delete their own PIXY media" on storage.objects for delete to authenticated using (bucket_id='pixy-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- PIXY moderation, rate limits, multi-photo posts and music library.
alter table public.posts
  add column if not exists media_items jsonb not null default '[]'::jsonb,
  add column if not exists music_url text,
  add column if not exists music_title text;
alter table public.posts drop constraint if exists posts_media_items_limit;
alter table public.posts add constraint posts_media_items_limit
  check (jsonb_typeof(media_items)='array' and jsonb_array_length(media_items)<=15);

create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  artist text not null default 'PIXY Music' check (char_length(artist)<=80),
  audio_url text not null,
  storage_path text not null,
  duration_seconds integer,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.music_tracks enable row level security;
create policy "Active PIXY music is visible" on public.music_tracks for select to authenticated using (active=true);
create policy "Moderators manage PIXY music" on public.music_tracks for all to authenticated
  using (private.is_pixy_admin())
  with check (private.is_pixy_admin() and created_by=(select auth.uid()));
grant select,insert,update,delete on public.music_tracks to authenticated;

create or replace function private.pixy_can_perform(p_user_id uuid,p_scope text)
returns boolean language sql stable security definer
set search_path='pg_catalog','private'
as $$
 select p_user_id is not null and not exists(
  select 1 from private.moderation_actions a
  where a.target_user_id=p_user_id and a.active=true
   and a.action_type in ('ban','restrict') and a.scope in ('all',p_scope)
 );
$$;
revoke all on function private.pixy_can_perform(uuid,text) from public,anon;
grant execute on function private.pixy_can_perform(uuid,text) to authenticated;

drop policy if exists "Users publish as themselves" on public.posts;
create policy "Users publish as themselves" on public.posts for insert to authenticated
 with check ((select auth.uid())=author_id and private.pixy_can_perform((select auth.uid()),'posts'));
drop policy if exists "Users comment on accessible posts" on public.comments;
create policy "Users comment on accessible posts" on public.comments for insert to authenticated
 with check ((select auth.uid())=author_id and private.pixy_can_perform((select auth.uid()),'comments')
 and exists(select 1 from public.posts p where p.id=comments.post_id and (p.visibility='public' or p.author_id=(select auth.uid()))));
drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages" on public.messages for insert to authenticated
 with check (sender_id=(select auth.uid()) and private.pixy_can_perform((select auth.uid()),'messages')
 and exists(select 1 from public.conversation_members m where m.conversation_id=messages.conversation_id and m.user_id=(select auth.uid())));
drop policy if exists "Users create their own stories" on public.stories;
create policy "Users create their own stories" on public.stories for insert to authenticated
 with check ((select auth.uid())=author_id and private.pixy_can_perform((select auth.uid()),'stories'));
drop policy if exists "Users react on accessible posts" on public.reactions;
create policy "Users react on accessible posts" on public.reactions for insert to authenticated
 with check ((select auth.uid())=user_id and private.pixy_can_perform((select auth.uid()),'reactions')
 and exists(select 1 from public.posts p where p.id=reactions.post_id and (p.visibility='public' or p.author_id=(select auth.uid()))));
drop policy if exists "Users update reactions on accessible posts" on public.reactions;
create policy "Users update reactions on accessible posts" on public.reactions for update to authenticated
 using ((select auth.uid())=user_id and private.pixy_can_perform((select auth.uid()),'reactions'))
 with check ((select auth.uid())=user_id and private.pixy_can_perform((select auth.uid()),'reactions')
 and exists(select 1 from public.posts p where p.id=reactions.post_id and (p.visibility='public' or p.author_id=(select auth.uid()))));
drop policy if exists "Users follow from their own account" on public.follows;
create policy "Users follow from their own account" on public.follows for insert to authenticated
 with check ((select auth.uid())=follower_id and private.pixy_can_perform((select auth.uid()),'follows'));

create or replace function private.enforce_pixy_rate_limits()
returns trigger language plpgsql security definer
set search_path='pg_catalog','public','private'
as $$
declare v_user uuid;v_count bigint;v_limit integer;v_window interval;v_label text;
begin
 if tg_table_name='posts' then v_user:=new.author_id;v_limit:=10;v_window:=interval '24 hours';v_label:='10 публикаций за 24 часа';
 elsif tg_table_name='stories' then v_user:=new.author_id;v_limit:=20;v_window:=interval '24 hours';v_label:='20 историй за 24 часа';
 elsif tg_table_name='comments' then v_user:=new.author_id;v_limit:=30;v_window:=interval '1 hour';v_label:='30 комментариев в час';
 elsif tg_table_name='messages' then v_user:=new.sender_id;v_limit:=60;v_window:=interval '1 minute';v_label:='60 сообщений в минуту';
 else return new;end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||tg_table_name,0));
 if tg_table_name='posts' then select count(*) into v_count from public.posts where author_id=v_user and created_at>now()-v_window;
 elsif tg_table_name='stories' then select count(*) into v_count from public.stories where author_id=v_user and created_at>now()-v_window;
 elsif tg_table_name='comments' then select count(*) into v_count from public.comments where author_id=v_user and created_at>now()-v_window;
 else select count(*) into v_count from public.messages where sender_id=v_user and created_at>now()-v_window;end if;
 if v_count>=v_limit then raise exception 'Достигнут лимит: %',v_label using errcode='P0001';end if;
 return new;
end;$$;
drop trigger if exists pixy_rate_limit_posts on public.posts;
create trigger pixy_rate_limit_posts before insert on public.posts for each row execute function private.enforce_pixy_rate_limits();
drop trigger if exists pixy_rate_limit_stories on public.stories;
create trigger pixy_rate_limit_stories before insert on public.stories for each row execute function private.enforce_pixy_rate_limits();
drop trigger if exists pixy_rate_limit_comments on public.comments;
create trigger pixy_rate_limit_comments before insert on public.comments for each row execute function private.enforce_pixy_rate_limits();
drop trigger if exists pixy_rate_limit_messages on public.messages;
create trigger pixy_rate_limit_messages before insert on public.messages for each row execute function private.enforce_pixy_rate_limits();

update storage.buckets set allowed_mime_types=array[
 'image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm',
 'audio/webm','audio/ogg','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/x-m4a'
] where id='pixy-media';

-- Add the account UUID to private.pixy_admins in the deployed project only.
