create table if not exists public.hour_generator_collaborators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hour_generator_reports (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.hour_generator_collaborators(id) on delete cascade,
  reference_month date not null,
  period_start date,
  period_end date,
  repasse_percent numeric(5,2) not null default 0,
  input_data text not null default '',
  report_html text not null default '',
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collaborator_id, reference_month)
);

alter table public.hour_generator_collaborators enable row level security;
alter table public.hour_generator_reports enable row level security;

drop policy if exists "authenticated read hour collaborators" on public.hour_generator_collaborators;
drop policy if exists "authenticated insert hour collaborators" on public.hour_generator_collaborators;
drop policy if exists "authenticated update hour collaborators" on public.hour_generator_collaborators;
drop policy if exists "authenticated delete hour collaborators" on public.hour_generator_collaborators;
drop policy if exists "authenticated read hour reports" on public.hour_generator_reports;
drop policy if exists "authenticated insert hour reports" on public.hour_generator_reports;
drop policy if exists "authenticated update hour reports" on public.hour_generator_reports;
drop policy if exists "authenticated delete hour reports" on public.hour_generator_reports;

create policy "authenticated read hour collaborators" on public.hour_generator_collaborators for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated insert hour collaborators" on public.hour_generator_collaborators for insert to authenticated with check ((select auth.uid()) is not null);
create policy "authenticated update hour collaborators" on public.hour_generator_collaborators for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated delete hour collaborators" on public.hour_generator_collaborators for delete to authenticated using ((select auth.uid()) is not null);

create policy "authenticated read hour reports" on public.hour_generator_reports for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated insert hour reports" on public.hour_generator_reports for insert to authenticated with check ((select auth.uid()) is not null);
create policy "authenticated update hour reports" on public.hour_generator_reports for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated delete hour reports" on public.hour_generator_reports for delete to authenticated using ((select auth.uid()) is not null);

create index if not exists idx_hour_generator_reports_collaborator_month on public.hour_generator_reports (collaborator_id, reference_month);