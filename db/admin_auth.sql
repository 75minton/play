-- 75Rabbit server-side administrator authentication
create extension if not exists pgcrypto with schema extensions;

create table if not exists app_admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[A-Za-z0-9_.-]{3,50}$'),
  password_hash text not null,
  must_change_password boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_admin_accounts enable row level security;

create or replace function public.verify_app_admin(p_username text, p_password text)
returns table(id uuid, username text, must_change_password boolean)
language sql
security definer
set search_path = public
as $$
  select a.id, a.username, a.must_change_password
  from app_admin_accounts a
  where lower(a.username) = lower(trim(p_username))
    and a.active = true
    and a.password_hash = extensions.crypt(p_password, a.password_hash)
  limit 1;
$$;

create or replace function public.change_app_admin_password(p_admin_id uuid, p_current_password text, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(p_new_password) < 8 then return false; end if;
  update app_admin_accounts
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 12)),
      must_change_password = false,
      updated_at = now()
  where id = p_admin_id
    and active = true
    and password_hash = extensions.crypt(p_current_password, password_hash);
  return found;
end;
$$;

revoke all on function public.verify_app_admin(text, text) from public, anon, authenticated;
revoke all on function public.change_app_admin_password(uuid, text, text) from public, anon, authenticated;
grant execute on function public.verify_app_admin(text, text) to service_role;
grant execute on function public.change_app_admin_password(uuid, text, text) to service_role;

insert into app_admin_accounts (username, password_hash, must_change_password)
values ('admin', extensions.crypt('rabbit', extensions.gen_salt('bf', 12)), true)
on conflict (username) do nothing;
