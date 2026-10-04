drop policy if exists "admins_full_access_financial_split_settings" on public.financial_split_settings;
drop policy if exists "admins_full_access_teacher_financial_reports" on public.teacher_financial_reports;
drop policy if exists "admins_manage_whatsapp_message_templates" on public.whatsapp_message_templates;
drop policy if exists "admins_read_all_profiles" on public.user_profiles;
drop policy if exists "admins_manage_profiles" on public.user_profiles;

drop function if exists public.is_active_admin();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
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

revoke all on function private.is_active_admin() from public, anon;
grant execute on function private.is_active_admin() to authenticated;

create policy "admins_read_all_profiles"
on public.user_profiles
for select
to authenticated
using ((select private.is_active_admin()));

create policy "admins_manage_profiles"
on public.user_profiles
for update
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins_full_access_financial_split_settings"
on public.financial_split_settings
for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins_full_access_teacher_financial_reports"
on public.teacher_financial_reports
for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins_manage_whatsapp_message_templates"
on public.whatsapp_message_templates
for all
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));