-- Bilanz: Konten und monatliche Stände, eine Zeile pro Element.
-- id "a:<konto>" = Konto {name, kind}, id "v:<YYYY-MM>:<konto>" = Stand (Zahl).
-- Gelöschte Elemente bleiben als "deleted" stehen, damit andere Geräte es mitbekommen.
create table if not exists public.bilanz (
  user_id    uuid        not null default auth.uid() references auth.users on delete cascade,
  id         text        not null,
  data       jsonb       not null,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);
create index if not exists bilanz_user_updated on public.bilanz (user_id, updated_at);

drop trigger if exists bilanz_touch on public.bilanz;
create trigger bilanz_touch before insert or update on public.bilanz
  for each row execute function public.touch_updated_at();

alter table public.bilanz enable row level security;

drop policy if exists "eigene Bilanz" on public.bilanz;
create policy "eigene Bilanz" on public.bilanz for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update on public.bilanz to authenticated;
revoke all on public.bilanz from anon;
