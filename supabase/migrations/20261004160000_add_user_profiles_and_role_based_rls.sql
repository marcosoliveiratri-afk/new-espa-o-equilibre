create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('admin','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

insert into public.user_profiles (id, role)
select u.id,
       case when row_number() over (order by u.created_at, u.id) = 1 then 'admin' else 'staff' end
from auth.users u
on conflict (id) do update set role = excluded.role;

drop policy if exists "users_read_own_profile" on public.user_profiles;
create policy "users_read_own_profile"
on public.user_profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "admins_read_all_profiles" on public.user_profiles;
create policy "admins_read_all_profiles"
on public.user_profiles
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.active = true
  )
);

drop policy if exists "admins_manage_profiles" on public.user_profiles;
create policy "admins_manage_profiles"
on public.user_profiles
for update
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.active = true
  )
)
with check (
  exists (
    select 1 from public.user_profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.active = true
  )
);

create or replace function public.is_active_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and role = 'admin'
      and active = true
  );
$$;

revoke all on function public.is_active_admin() from public, anon;
grant execute on function public.is_active_admin() to authenticated;

drop policy if exists "authenticated_full_access_financial_split_settings" on public.financial_split_settings;
create policy "admins_full_access_financial_split_settings"
on public.financial_split_settings
for all
to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

drop policy if exists "authenticated_full_access_teacher_financial_reports" on public.teacher_financial_reports;
create policy "admins_full_access_teacher_financial_reports"
on public.teacher_financial_reports
for all
to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

drop policy if exists "authenticated_full_access_whatsapp_message_templates" on public.whatsapp_message_templates;
create policy "authenticated_read_whatsapp_message_templates"
on public.whatsapp_message_templates
for select
to authenticated
using (exists (
  select 1 from public.user_profiles p
  where p.id = (select auth.uid())
    and p.active = true
));
create policy "admins_manage_whatsapp_message_templates"
on public.whatsapp_message_templates
for all
to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

grant select on public.user_profiles to authenticated;
grant select, insert, update, delete on public.financial_split_settings to authenticated;
grant select, insert, update, delete on public.teacher_financial_reports to authenticated;
grant select, insert, update, delete on public.whatsapp_message_templates to authenticated;
