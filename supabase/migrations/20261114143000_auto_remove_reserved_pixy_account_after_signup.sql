-- Allow the signup request to proceed, then remove only this reserved account.
-- This is intentionally scoped to the exact username and its synthetic PIXY login.
drop trigger if exists block_reserved_pixy_username on auth.users;
drop trigger if exists block_reserved_pixy_profile_name on public.profiles;

create or replace function private.remove_reserved_pixy_account_after_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', ''))) = 'vam_pizda'
     or lower(btrim(coalesce(new.email, ''))) = 'vam_pizda@login.pixy.invalid' then
    delete from auth.users where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists remove_reserved_pixy_account_after_signup on auth.users;
create trigger remove_reserved_pixy_account_after_signup
after insert on auth.users
for each row execute function private.remove_reserved_pixy_account_after_signup();

drop function if exists private.block_reserved_pixy_username();
drop function if exists private.block_reserved_pixy_profile_name();
