-- Ausgaben: Datenbank für die Synchronisation zwischen Geräten.
-- Einmal komplett im Supabase SQL Editor ausführen.

-- Ein Eintrag pro Zeile. Gelöschte Einträge bleiben als "deleted" stehen,
-- damit andere Geräte die Löschung mitbekommen.
create table if not exists public.entries (
  user_id    uuid        not null default auth.uid() references auth.users on delete cascade,
  id         text        not null,
  data       jsonb       not null,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);
create index if not exists entries_user_updated on public.entries (user_id, updated_at);

-- Kategorien und weitere Einstellungen, eine Zeile pro Nutzer
create table if not exists public.user_settings (
  user_id    uuid        primary key default auth.uid() references auth.users on delete cascade,
  cats       jsonb       not null default '{"out": [], "in": []}',
  updated_at timestamptz not null default clock_timestamp()
);

-- Zeitstempel immer vom Server setzen, damit falsch gestellte Geräteuhren nicht stören
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before insert or update on public.entries
  for each row execute function public.touch_updated_at();

drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before insert or update on public.user_settings
  for each row execute function public.touch_updated_at();

-- Jeder sieht und ändert ausschließlich seine eigenen Daten
alter table public.entries enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "eigene Einträge" on public.entries;
create policy "eigene Einträge" on public.entries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "eigene Einstellungen" on public.user_settings;
create policy "eigene Einstellungen" on public.user_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update on public.entries to authenticated;
grant select, insert, update on public.user_settings to authenticated;
revoke all on public.entries from anon;
revoke all on public.user_settings from anon;
