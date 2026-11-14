-- Reserve a username associated with repeated destructive abuse reports.
-- Reject it before an Auth account is created and also guard profile writes.
create or replace function private.block_reserved_pixy_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', ''))) = 'vam_pizda'
     or lower(btrim(coalesce(new.email, ''))) = 'vam_pizda@login.pixy.invalid' then
    raise exception using
      errcode = '42501',
      message = 'This username is not available.';
  end if;

  return new;
end;
$$;

drop trigger if exists block_reserved_pixy_username on auth.users;
create trigger block_reserved_pixy_username
before insert on auth.users
for each row execute function private.block_reserved_pixy_username();

create or replace function private.block_reserved_pixy_profile_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if lower(btrim(coalesce(new.username, ''))) = 'vam_pizda' then
    raise exception using
      errcode = '42501',
      message = 'This username is not available.';
  end if;

  return new;
end;
$$;

drop trigger if exists block_reserved_pixy_profile_name on public.profiles;
create trigger block_reserved_pixy_profile_name
before insert or update of username on public.profiles
for each row execute function private.block_reserved_pixy_profile_name();
