-- PIXY: gift market cycles, XION savings and daily block game
alter table public.gift_catalog
  add column if not exists market_direction text not null default 'up',
  add column if not exists market_until timestamptz;

alter table public.gift_catalog
  drop constraint if exists gift_catalog_market_direction_check;
alter table public.gift_catalog
  add constraint gift_catalog_market_direction_check
  check (market_direction in ('up','down'));

-- Immediate launch discount: halve every gift except the unique NEFT #0001.
update public.gift_catalog
set price_xion = greatest(1, floor(price_xion::numeric / 2)::integer),
    price_growth_per_hour = 0,
    price_growth_amount = 0,
    market_direction = 'up',
    market_until = now() + make_interval(hours => 1 + floor(random() * 20)::integer)
where not (kind = 'neft' and (design_number = 1 or supply_limit = 1));

update public.gift_catalog
set price_growth_per_hour = 0,
    price_growth_amount = 0,
    market_direction = 'up',
    market_until = null
where kind = 'neft' and (design_number = 1 or supply_limit = 1);

create or replace function public.refresh_gift_market()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.gift_catalog
  set price_xion = case
        when market_direction = 'up' then greatest(1, round(price_xion * 1.5)::integer)
        else greatest(1, round(price_xion * 0.5)::integer)
      end,
      market_direction = case when market_direction = 'up' then 'down' else 'up' end,
      market_until = now() + case
        when market_direction = 'up'
          then make_interval(hours => 1 + floor(random() * 11)::integer)
        else make_interval(hours => 1 + floor(random() * 20)::integer)
      end
  where available = true
    and market_until is not null
    and market_until <= now()
    and not (kind = 'neft' and (design_number = 1 or supply_limit = 1));
end;
$$;

create table if not exists public.xion_savings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  unlock_at timestamptz not null default (now() + interval '24 hours'),
  updated_at timestamptz not null default now()
);
alter table public.xion_savings enable row level security;
drop policy if exists "Users can read own XION savings" on public.xion_savings;
create policy "Users can read own XION savings"
  on public.xion_savings for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.deposit_xion_savings(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
  bal integer;
begin
  if me is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a positive amount'; end if;
  perform pg_advisory_xact_lock(hashtext(me::text));
  select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id = me;
  if bal < p_amount then raise exception 'Not enough XION'; end if;
  insert into public.xion_ledger(user_id,amount,reason)
  values(me,-p_amount,'savings_deposit');
  insert into public.xion_savings(user_id,balance,unlock_at,updated_at)
  values(me,p_amount,now()+interval '24 hours',now())
  on conflict(user_id) do update
    set balance = public.xion_savings.balance + excluded.balance,
        unlock_at = now()+interval '24 hours',
        updated_at = now();
  select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id = me;
  return bal;
end;
$$;

create or replace function public.withdraw_xion_savings()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
  v_savings public.xion_savings%rowtype;
  bal integer;
begin
  if me is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtext(me::text));
  select * into v_savings from public.xion_savings where user_id=me for update;
  if not found or v_savings.balance <= 0 then raise exception 'Savings are empty'; end if;
  if now() < v_savings.unlock_at then
    raise exception 'Savings unlock at %', to_char(v_savings.unlock_at at time zone 'UTC','YYYY-MM-DD HH24:MI UTC');
  end if;
  insert into public.xion_ledger(user_id,amount,reason)
  values(me,v_savings.balance,'savings_withdrawal');
  update public.xion_savings set balance=0, updated_at=now() where user_id=me;
  select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
  return bal;
end;
$$;

-- Sale proceeds: 20% of the amount after the existing 3 XION fee goes to savings.
create or replace function public.sell_owned_gift(inventory_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, private, auth
as $function$
declare
 me uuid:=auth.uid();
 v_admin uuid:='c07b0e17-fefe-49c3-be6c-9ae490b40f7f';
 v_item public.gift_inventory%rowtype;
 v_sale integer;
 v_fee integer:=3;
 v_net integer;
 v_savings integer;
 v_liquid integer;
 bal integer;
begin
 if me is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtext(me::text));
 select * into v_item from public.gift_inventory
 where id=inventory_id and owner_id=me and sold_at is null for update;
 if not found then raise exception 'Gift is not available for sale'; end if;
 if v_item.growth_amount>0 and v_item.growth_interval_minutes>0 then
   v_sale:=v_item.purchase_price+(floor(extract(epoch from (now()-v_item.acquired_at))/(v_item.growth_interval_minutes*60))::integer*v_item.growth_amount);
 else
   v_sale:=v_item.purchase_price+(floor(extract(epoch from (now()-v_item.acquired_at))/3600)::integer*v_item.growth_per_hour);
 end if;
 if v_sale<v_fee then raise exception 'Sale value must be at least 3 XION to cover the commission'; end if;
 v_net:=v_sale-v_fee;
 v_savings:=floor(v_net*0.20)::integer;
 v_liquid:=v_net-v_savings;
 update public.gift_inventory set sold_at=now(),sale_price=v_sale where id=v_item.id;
 if v_liquid>0 then
   insert into public.xion_ledger(user_id,amount,reason,reference_id)
   values(me,v_liquid,'gift_sold:'||v_item.gift_id||':liquid',v_item.id);
 end if;
 if v_savings>0 then
   insert into public.xion_savings(user_id,balance,unlock_at,updated_at)
   values(me,v_savings,now()+interval '24 hours',now())
   on conflict(user_id) do update
     set balance=public.xion_savings.balance+excluded.balance,
         unlock_at=now()+interval '24 hours',
         updated_at=now();
 end if;
 insert into public.xion_ledger(user_id,amount,reason,reference_id)
 values(v_admin,v_fee,'gift_sale_commission:'||v_item.gift_id,v_item.id);
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 return bal;
end;
$function$;

-- Apply market price before both kinds of gift purchase.
create or replace function public.buy_gift_for_self(gift_key text)
returns integer
language plpgsql
security definer
set search_path to public, auth
as $function$
declare
 me uuid:=auth.uid();
 v_admin uuid:='c07b0e17-fefe-49c3-be6c-9ae490b40f7f';
 v_gift public.gift_catalog%rowtype;
 bal integer;
 v_serial text;
 v_price integer;
 v_total integer;
 v_fee integer:=2;
begin
 if me is null then raise exception 'Authentication required'; end if;
 perform public.refresh_gift_market();
 perform pg_advisory_xact_lock(hashtext(me::text));
 select * into v_gift from public.gift_catalog where id=gift_key and available=true for update;
 if not found then raise exception 'Gift not available'; end if;
 if v_gift.supply_limit is not null and v_gift.sold_count>=v_gift.supply_limit then
   update public.gift_catalog set available=false where id=gift_key;
   raise exception 'Gift not available';
 end if;
 v_price:=v_gift.price_xion;
 v_total:=v_price+v_fee;
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 if bal<v_total then raise exception 'Not enough points: gift price plus 2 XION commission required'; end if;
 if v_gift.kind='neft' and v_gift.supply_limit is not null then v_serial:='0001'; end if;
 insert into public.gift_inventory(owner_id,gift_id,purchase_price,growth_per_hour,growth_amount,growth_interval_minutes,serial_number,gift_kind,rarity,design_number,background_key)
 values(me,gift_key,v_price,0,0,60,v_serial,v_gift.kind,v_gift.rarity,v_gift.design_number,v_gift.background_key);
 update public.gift_catalog set sold_count=sold_count+1,
   available=case when supply_limit is not null and sold_count+1>=supply_limit then false else available end
 where id=gift_key;
 insert into public.xion_ledger(user_id,amount,reason) values(me,-v_total,'gift_purchase:'||gift_key||':fee2');
 insert into public.xion_ledger(user_id,amount,reason) values(v_admin,v_fee,'gift_purchase_commission:'||gift_key);
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 return bal;
end;
$function$;

create or replace function private.send_virtual_gift_impl(recipient uuid, gift_key text)
returns integer
language plpgsql
security definer
set search_path to public, auth
as $function$
declare
 me uuid := auth.uid();
 v_admin uuid := 'c07b0e17-fefe-49c3-be6c-9ae490b40f7f';
 v_gift public.gift_catalog%rowtype;
 bal integer;
 v_price integer;
 v_fee integer := 2;
 v_total integer;
begin
 if me is null then raise exception 'Authentication required'; end if;
 if recipient is null then raise exception 'Choose a recipient'; end if;
 perform public.refresh_gift_market();
 perform pg_advisory_xact_lock(hashtext(me::text));
 select * into v_gift from public.gift_catalog where id=gift_key and available=true for update;
 if not found then raise exception 'Gift not available'; end if;
 if v_gift.supply_limit is not null and v_gift.sold_count>=v_gift.supply_limit then
   update public.gift_catalog set available=false where id=gift_key;
   raise exception 'Gift not available';
 end if;
 v_price := v_gift.price_xion;
 v_total := v_price + v_fee;
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 if bal<v_total then raise exception 'Not enough XION: current gift price plus 2 XION commission required'; end if;
 update public.gift_catalog set sold_count=sold_count+1,
   available=case when supply_limit is not null and sold_count+1>=supply_limit then false else available end
 where id=gift_key;
 insert into public.gift_transfers(sender_id,recipient_id,gift_id,purchase_price) values(me,recipient,gift_key,v_price);
 insert into public.xion_ledger(user_id,amount,reason) values(me,-v_total,'gift_sent:'||gift_key||':fee2');
 insert into public.xion_ledger(user_id,amount,reason) values(v_admin,v_fee,'gift_send_commission:'||gift_key);
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 return bal;
end;
$function$;

create table if not exists public.pixy_block_game_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 lines_cleared integer,
 reward integer not null default 0 check (reward >= 0)
);
alter table public.pixy_block_game_sessions enable row level security;
create index if not exists pixy_block_game_sessions_daily_idx
 on public.pixy_block_game_sessions(user_id,started_at);

create or replace function public.start_pixy_block_game()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
 me uuid:=auth.uid();
 v_count integer;
 v_id uuid;
begin
 if me is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtext(me::text));
 select count(*) into v_count from public.pixy_block_game_sessions
 where user_id=me and started_at >= date_trunc('day',now());
 if v_count>=2 then raise exception 'Daily limit reached: 2 games per day'; end if;
 insert into public.pixy_block_game_sessions(user_id) values(me) returning id into v_id;
 return v_id;
end;
$$;

create or replace function public.finish_pixy_block_game(p_game_id uuid,p_lines integer)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
 me uuid:=auth.uid();
 v_game public.pixy_block_game_sessions%rowtype;
 v_reward integer;
 bal integer;
begin
 if me is null then raise exception 'Authentication required'; end if;
 if p_lines is null or p_lines<0 or p_lines>10 then raise exception 'Invalid line count'; end if;
 select * into v_game from public.pixy_block_game_sessions
 where id=p_game_id and user_id=me and finished_at is null for update;
 if not found then raise exception 'Game session is not available'; end if;
 if now()-v_game.started_at < interval '30 seconds' then raise exception 'Game session is too short'; end if;
 v_reward:=p_lines*5;
 update public.pixy_block_game_sessions
 set finished_at=now(),lines_cleared=p_lines,reward=v_reward where id=p_game_id;
 if v_reward>0 then
   insert into public.xion_ledger(user_id,amount,reason,reference_id)
   values(me,v_reward,'block_game_reward',p_game_id);
 end if;
 select coalesce(sum(amount),0) into bal from public.xion_ledger where user_id=me;
 return bal;
end;
$$;

grant execute on function public.refresh_gift_market() to authenticated;
grant execute on function public.deposit_xion_savings(integer) to authenticated;
grant execute on function public.withdraw_xion_savings() to authenticated;
grant execute on function public.start_pixy_block_game() to authenticated;
grant execute on function public.finish_pixy_block_game(uuid,integer) to authenticated;
