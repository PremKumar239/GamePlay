-- GAME PLAY admin tax settings (reference only — does not change customer prices or order totals).
-- Run this whole script in the Supabase SQL editor (safe to run again).

create table if not exists public.tax_settings (
  id integer primary key default 1 check (id = 1),
  card_tax_percent numeric(6, 2) not null default 0 check (card_tax_percent >= 0 and card_tax_percent <= 100),
  cod_tax_percent numeric(6, 2) not null default 0 check (cod_tax_percent >= 0 and cod_tax_percent <= 100),
  updated_at timestamptz not null default now()
);

insert into public.tax_settings (id, card_tax_percent, cod_tax_percent)
values (1, 0, 0)
on conflict (id) do nothing;

alter table public.tax_settings enable row level security;

drop policy if exists "Admins read tax settings" on public.tax_settings;
create policy "Admins read tax settings"
  on public.tax_settings for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins update tax settings" on public.tax_settings;
create policy "Admins update tax settings"
  on public.tax_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins insert tax settings" on public.tax_settings;
create policy "Admins insert tax settings"
  on public.tax_settings for insert to authenticated
  with check (public.is_admin());

revoke all on public.tax_settings from anon, authenticated;
grant select, insert, update on public.tax_settings to authenticated;

drop trigger if exists tax_settings_touch_updated_at on public.tax_settings;
create trigger tax_settings_touch_updated_at before update on public.tax_settings
for each row execute function public.touch_updated_at();
