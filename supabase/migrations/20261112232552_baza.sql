-- Migracja bazowa: odtworzenie 1:1 schematu public z bazy w chmurze (ADR-001, W-02).
-- Źródło: docs/04-plan/schemat-chmury.md (odczyt katalogu 2026-11-12/13).
-- Bez obiektów platformy (auth, storage, event triggery, public.rls_auto_enable) i bez rozszerzeń:
-- tworzy je platforma Supabase. Tej migracji nie edytujemy; zmiany to nowe migracje.

-- ---------------------------------------------------------------------------------------------
-- Typy
-- ---------------------------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'editor');

-- ---------------------------------------------------------------------------------------------
-- Tabele
-- ---------------------------------------------------------------------------------------------

create table public.szkolenia (
  id text not null,
  sort_order integer not null,
  cat text not null,
  icon text not null,
  title text not null,
  level text not null,
  hours text not null,
  format text not null,
  price integer not null,
  badge text,
  fundable boolean not null default false,
  opis text not null,
  learn text[] not null,
  program jsonb not null,
  for_whom text not null,
  terms text[],
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint szkolenia_pkey primary key (id),
  constraint szkolenia_sort_order_key unique (sort_order),
  constraint szkolenia_cat_check check (cat = any (array['AI', 'ESG', 'Angielski', 'Software', 'B+R'])),
  constraint szkolenia_for_whom_check check (length(btrim(for_whom)) > 0),
  constraint szkolenia_format_check check (length(btrim(format)) > 0),
  constraint szkolenia_hours_check check (length(btrim(hours)) > 0),
  constraint szkolenia_icon_check check (icon = any (array['cpu', 'leaf', 'languages', 'code-xml', 'flask-conical'])),
  constraint szkolenia_id_check check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint szkolenia_learn_check check (array_length(learn, 1) >= 1 and array_length(learn, 1) <= 12),
  constraint szkolenia_level_check check (length(btrim(level)) > 0),
  constraint szkolenia_opis_check check (length(btrim(opis)) > 0),
  constraint szkolenia_price_check check (price >= 0),
  constraint szkolenia_program_check check (jsonb_typeof(program) = 'array' and jsonb_array_length(program) >= 1 and jsonb_array_length(program) <= 24),
  constraint szkolenia_sort_order_check check (sort_order >= 0),
  constraint szkolenia_status_check check (status = any (array['draft', 'published'])),
  constraint szkolenia_title_check check (length(btrim(title)) > 0)
);

comment on table public.szkolenia is 'Oferta szkoleń. Mapuje typ Szkolenie z src/lib/szkolenia/adapter.ts (ISK-34). Publiczny odczyt = tylko published.';
comment on column public.szkolenia.id is 'Stabilny identyfikator = segment URL /szkolenia/$id. Nie zmieniać — zachowuje linki E01.';
comment on column public.szkolenia.opis is 'Pole `desc` kontraktu (desc = zarezerwowane w SQL). Objęte wyszukiwaniem (title+cat+desc).';
comment on column public.szkolenia.terms is 'NULL ⇒ TERMINY_DOMYSLNE po stronie frontendu; pusta tablica ⇒ brak terminów.';

create index szkolenia_cat_idx on public.szkolenia (cat);
create index szkolenia_status_sort_idx on public.szkolenia (status, sort_order);

create table public.trenerzy (
  id text not null,
  sort_order integer not null,
  name text not null,
  initials text not null,
  role text not null,
  areas text[] not null,
  tagline text not null,
  bio text not null,
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  skills text[] not null default '{}'::text[],
  photo_url text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trenerzy_pkey primary key (id),
  constraint trenerzy_sort_order_key unique (sort_order),
  constraint trenerzy_areas_check check (areas <@ array['AI', 'ESG', 'Angielski', 'Software', 'B+R'] and array_length(areas, 1) >= 1 and array_length(areas, 1) <= 5),
  constraint trenerzy_bio_check check (length(btrim(bio)) > 0),
  constraint trenerzy_education_check check (jsonb_typeof(education) = 'array'),
  constraint trenerzy_experience_check check (jsonb_typeof(experience) = 'array'),
  constraint trenerzy_id_check check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint trenerzy_initials_check check (length(btrim(initials)) > 0),
  constraint trenerzy_name_check check (length(btrim(name)) > 0),
  constraint trenerzy_role_check check (length(btrim(role)) > 0),
  constraint trenerzy_sort_order_check check (sort_order >= 0),
  constraint trenerzy_status_check check (status = any (array['draft', 'published'])),
  constraint trenerzy_tagline_check check (length(btrim(tagline)) > 0)
);

comment on table public.trenerzy is 'Trenerzy. Nowa encja E02 (brak w HEAD). Kolumny wg makiety ZIP. Publiczny odczyt = tylko published.';
comment on column public.trenerzy.id is 'Stabilny identyfikator = segment URL /trenerzy/$id (nowa trasa E02/E).';
comment on column public.trenerzy.photo_url is 'Opcjonalne. Bucket Storage na zdjęcia = decyzja E02/C. Dziś makieta używa inicjałów.';

create index trenerzy_status_sort_idx on public.trenerzy (status, sort_order);

-- Kolumna sort_order_szkolenie jest piąta, jak w chmurze (dodana tam po created_at).
create table public.szkolenie_trener (
  szkolenie_id text not null,
  trener_id text not null,
  sort_order_trener integer not null default 0,
  created_at timestamptz not null default now(),
  sort_order_szkolenie integer not null default 0,
  constraint szkolenie_trener_pkey primary key (szkolenie_id, trener_id),
  constraint szkolenie_trener_szkolenie_id_fkey foreign key (szkolenie_id) references public.szkolenia (id) on delete cascade,
  constraint szkolenie_trener_trener_id_fkey foreign key (trener_id) references public.trenerzy (id) on delete cascade,
  constraint szkolenie_trener_sort_order_szkolenie_nieujemny check (sort_order_szkolenie >= 0),
  constraint szkolenie_trener_sort_order_trener_nieujemny check (sort_order_trener >= 0)
);

comment on table public.szkolenie_trener is 'Relacja M:N szkolenie↔trener. CASCADE kasuje tylko wiersze przypisań, nigdy encje po drugiej stronie.';
comment on column public.szkolenie_trener.sort_order_trener is 'Pozycja trenera na liście trenerów danego szkolenia (0-based). Zapis wyłącznie ze strony "szkolenie".';
comment on column public.szkolenie_trener.sort_order_szkolenie is 'Pozycja szkolenia na liście szkoleń danego trenera (0-based). Zapis wyłącznie ze strony "trener".';

create index szkolenie_trener_szkolenie_idx on public.szkolenie_trener (szkolenie_id);
create index szkolenie_trener_trener_idx on public.szkolenie_trener (trener_id);

create table public.user_roles (
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  constraint user_roles_pkey primary key (user_id, role),
  constraint user_roles_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

comment on table public.user_roles is 'Źródło prawdy o uprawnieniach redakcyjnych. Zapis wyłącznie przez service_role / SQL (ISKT). Brak drogi samonadania z klienta.';

-- ---------------------------------------------------------------------------------------------
-- Funkcje (wszystkie z search_path = '')
-- ---------------------------------------------------------------------------------------------

create function public.dotknij_updated_at()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  new.updated_at := now();
  -- published_at: ustaw przy pierwszej publikacji, wyczyść przy powrocie do szkicu.
  if new.status = 'published' and (new.published_at is null) then
    new.published_at := now();
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end;
$function$;

comment on function public.dotknij_updated_at() is 'Trigger BEFORE INSERT/UPDATE: utrzymuje updated_at oraz published_at względem kolumny status.';

create function public.has_role(_uid uuid, _role public.app_role)
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _uid and ur.role = _role
  );
$function$;

comment on function public.has_role(uuid, public.app_role) is 'Czy użytkownik _uid ma rolę _role. Używane w politykach RLS.';

create function public.is_admin()
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
  select public.has_role((select auth.uid()), 'admin'::public.app_role);
$function$;

create function public.is_staff()
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin'::public.app_role, 'editor'::public.app_role)
  );
$function$;

comment on function public.is_staff() is 'TRUE gdy bieżący użytkownik ma rolę admin lub editor. Brama zapisu treści w politykach RLS.';

create function public.moje_role()
 returns setof public.app_role
 language sql
 stable security definer
 set search_path to ''
as $function$
  select ur.role from public.user_roles ur
  where ur.user_id = (select auth.uid());
$function$;

comment on function public.moje_role() is 'Zwraca role bieżącego użytkownika. Pozwala panelowi poznać własne uprawnienia bez dostępu do tabeli user_roles.';

-- has_role tylko dla postgres i service_role; is_admin woła ją jako właściciel (security definer).
-- Pozostałe funkcje zostają z domyślnym EXECUTE (PUBLIC, anon, authenticated, service_role), jak w
-- chmurze (uwaga advisora 0028/0029 zostaje 1:1, ADR-001 pkt 4).
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Wyzwalacze
-- ---------------------------------------------------------------------------------------------

create trigger szkolenia_touch before insert or update on public.szkolenia
  for each row execute function public.dotknij_updated_at();
create trigger trenerzy_touch before insert or update on public.trenerzy
  for each row execute function public.dotknij_updated_at();

-- ---------------------------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------------------------

alter table public.szkolenia enable row level security;
alter table public.trenerzy enable row level security;
alter table public.szkolenie_trener enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_roles force row level security;

create policy szkolenia_select_publiczne on public.szkolenia for select to anon, authenticated
  using (status = 'published');
create policy szkolenia_select_staff on public.szkolenia for select to authenticated
  using (public.is_staff());
create policy szkolenia_insert_staff on public.szkolenia for insert to authenticated
  with check (public.is_staff());
create policy szkolenia_update_staff on public.szkolenia for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy szkolenia_delete_staff on public.szkolenia for delete to authenticated
  using (public.is_staff());

create policy trenerzy_select_publiczne on public.trenerzy for select to anon, authenticated
  using (status = 'published');
create policy trenerzy_select_staff on public.trenerzy for select to authenticated
  using (public.is_staff());
create policy trenerzy_insert_staff on public.trenerzy for insert to authenticated
  with check (public.is_staff());
create policy trenerzy_update_staff on public.trenerzy for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy trenerzy_delete_staff on public.trenerzy for delete to authenticated
  using (public.is_staff());

create policy szt_select_publiczne on public.szkolenie_trener for select to anon, authenticated
  using (
    exists (
      select 1 from public.szkolenia s
      where s.id = szkolenie_trener.szkolenie_id and s.status = 'published'
    )
    and exists (
      select 1 from public.trenerzy t
      where t.id = szkolenie_trener.trener_id and t.status = 'published'
    )
  );
create policy szt_select_staff on public.szkolenie_trener for select to authenticated
  using (public.is_staff());
create policy szt_insert_staff on public.szkolenie_trener for insert to authenticated
  with check (public.is_staff());
create policy szt_update_staff on public.szkolenie_trener for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy szt_delete_staff on public.szkolenie_trener for delete to authenticated
  using (public.is_staff());

-- user_roles: brak polityk (dostęp wyłącznie service_role i SQL).

-- ---------------------------------------------------------------------------------------------
-- Granty na tabelach (domyślne granty Supabase dla anon i authenticated były w chmurze odebrane)
-- ---------------------------------------------------------------------------------------------

-- Odbieramy tylko nadmiarowe uprawnienia, żeby kolejność wpisów ACL została jak po domyślnych grantach.
revoke insert, update, delete, truncate, references, trigger, maintain on table
  public.szkolenia, public.trenerzy, public.szkolenie_trener from anon;
revoke truncate, references, trigger, maintain on table
  public.szkolenia, public.trenerzy, public.szkolenie_trener from authenticated;
grant select on table public.szkolenia, public.trenerzy, public.szkolenie_trener to anon;
grant select, insert, update, delete on table
  public.szkolenia, public.trenerzy, public.szkolenie_trener to authenticated;
grant all on table
  public.szkolenia, public.trenerzy, public.szkolenie_trener, public.user_roles to service_role;

revoke all on table public.user_roles from anon, authenticated;
