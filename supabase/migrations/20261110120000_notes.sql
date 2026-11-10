-- Notizblock: ein freier Text pro Nutzer, wird wie die Kategorien abgeglichen
alter table public.user_settings add column if not exists notes text not null default '';
