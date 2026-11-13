-- W-02/K1, W-02/K2 (ADR-001): schemat public po migracjach jest identyczny z odczytem katalogu chmury
-- (docs/04-plan/schemat-chmury.md, „Zapytania do porównania”). Oczekiwane wartości to wyniki tych
-- samych zapytań katalogowych; różnica w którejkolwiek kategorii czerwieni test (shctl db test, CI baza).
begin;
select plan(7);

-- 1. Kolumny: nazwa, typ, not null, domyślna, komentarz; kolejność po attnum.
select is(
  (select string_agg(c.relname || '.' || a.attnum || ' ' || a.attname || ' | '
      || format_type(a.atttypid, a.atttypmod) || ' | ' || a.attnotnull || ' | '
      || coalesce(pg_get_expr(d.adbin, d.adrelid), '-') || ' | '
      || coalesce(col_description(c.oid, a.attnum), '-'), E'\n' order by c.relname, a.attnum)
   from pg_attribute a
   join pg_class c on c.oid = a.attrelid
   join pg_namespace n on n.oid = c.relnamespace
   left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
   where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped),
  $$szkolenia.1 id | text | true | - | Stabilny identyfikator = segment URL /szkolenia/$id. Nie zmieniać — zachowuje linki E01.
szkolenia.2 sort_order | integer | true | - | -
szkolenia.3 cat | text | true | - | -
szkolenia.4 icon | text | true | - | -
szkolenia.5 title | text | true | - | -
szkolenia.6 level | text | true | - | -
szkolenia.7 hours | text | true | - | -
szkolenia.8 format | text | true | - | -
szkolenia.9 price | integer | true | - | -
szkolenia.10 badge | text | false | - | -
szkolenia.11 fundable | boolean | true | false | -
szkolenia.12 opis | text | true | - | Pole `desc` kontraktu (desc = zarezerwowane w SQL). Objęte wyszukiwaniem (title+cat+desc).
szkolenia.13 learn | text[] | true | - | -
szkolenia.14 program | jsonb | true | - | -
szkolenia.15 for_whom | text | true | - | -
szkolenia.16 terms | text[] | false | - | NULL ⇒ TERMINY_DOMYSLNE po stronie frontendu; pusta tablica ⇒ brak terminów.
szkolenia.17 status | text | true | 'draft'::text | -
szkolenia.18 published_at | timestamp with time zone | false | - | -
szkolenia.19 created_at | timestamp with time zone | true | now() | -
szkolenia.20 updated_at | timestamp with time zone | true | now() | -
szkolenie_trener.1 szkolenie_id | text | true | - | -
szkolenie_trener.2 trener_id | text | true | - | -
szkolenie_trener.3 sort_order_trener | integer | true | 0 | Pozycja trenera na liście trenerów danego szkolenia (0-based). Zapis wyłącznie ze strony "szkolenie".
szkolenie_trener.4 created_at | timestamp with time zone | true | now() | -
szkolenie_trener.5 sort_order_szkolenie | integer | true | 0 | Pozycja szkolenia na liście szkoleń danego trenera (0-based). Zapis wyłącznie ze strony "trener".
trenerzy.1 id | text | true | - | Stabilny identyfikator = segment URL /trenerzy/$id (nowa trasa E02/E).
trenerzy.2 sort_order | integer | true | - | -
trenerzy.3 name | text | true | - | -
trenerzy.4 initials | text | true | - | -
trenerzy.5 role | text | true | - | -
trenerzy.6 areas | text[] | true | - | -
trenerzy.7 tagline | text | true | - | -
trenerzy.8 bio | text | true | - | -
trenerzy.9 experience | jsonb | true | '[]'::jsonb | -
trenerzy.10 education | jsonb | true | '[]'::jsonb | -
trenerzy.11 skills | text[] | true | '{}'::text[] | -
trenerzy.12 photo_url | text | false | - | Opcjonalne. Bucket Storage na zdjęcia = decyzja E02/C. Dziś makieta używa inicjałów.
trenerzy.13 status | text | true | 'draft'::text | -
trenerzy.14 published_at | timestamp with time zone | false | - | -
trenerzy.15 created_at | timestamp with time zone | true | now() | -
trenerzy.16 updated_at | timestamp with time zone | true | now() | -
user_roles.1 user_id | uuid | true | - | -
user_roles.2 role | app_role | true | - | -
user_roles.3 created_at | timestamp with time zone | true | now() | -$$,
  'kolumny public jak w chmurze (kolejność, typy, not null, domyślne, komentarze)'
);

-- 2. Ograniczenia c, p, u, f: pg_get_constraintdef.
select is(
  (select string_agg(c.relname || ' ' || k.conname || ' ' || pg_get_constraintdef(k.oid), E'\n'
      order by c.relname, k.conname)
   from pg_constraint k
   join pg_class c on c.oid = k.conrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and k.contype in ('c', 'p', 'u', 'f')),
  $$szkolenia szkolenia_cat_check CHECK ((cat = ANY (ARRAY['AI'::text, 'ESG'::text, 'Angielski'::text, 'Software'::text, 'B+R'::text])))
szkolenia szkolenia_for_whom_check CHECK ((length(btrim(for_whom)) > 0))
szkolenia szkolenia_format_check CHECK ((length(btrim(format)) > 0))
szkolenia szkolenia_hours_check CHECK ((length(btrim(hours)) > 0))
szkolenia szkolenia_icon_check CHECK ((icon = ANY (ARRAY['cpu'::text, 'leaf'::text, 'languages'::text, 'code-xml'::text, 'flask-conical'::text])))
szkolenia szkolenia_id_check CHECK ((id ~ '^[a-z0-9][a-z0-9-]*$'::text))
szkolenia szkolenia_learn_check CHECK (((array_length(learn, 1) >= 1) AND (array_length(learn, 1) <= 12)))
szkolenia szkolenia_level_check CHECK ((length(btrim(level)) > 0))
szkolenia szkolenia_opis_check CHECK ((length(btrim(opis)) > 0))
szkolenia szkolenia_pkey PRIMARY KEY (id)
szkolenia szkolenia_price_check CHECK ((price >= 0))
szkolenia szkolenia_program_check CHECK (((jsonb_typeof(program) = 'array'::text) AND (jsonb_array_length(program) >= 1) AND (jsonb_array_length(program) <= 24)))
szkolenia szkolenia_sort_order_check CHECK ((sort_order >= 0))
szkolenia szkolenia_sort_order_key UNIQUE (sort_order)
szkolenia szkolenia_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
szkolenia szkolenia_title_check CHECK ((length(btrim(title)) > 0))
szkolenie_trener szkolenie_trener_pkey PRIMARY KEY (szkolenie_id, trener_id)
szkolenie_trener szkolenie_trener_sort_order_szkolenie_nieujemny CHECK ((sort_order_szkolenie >= 0))
szkolenie_trener szkolenie_trener_sort_order_trener_nieujemny CHECK ((sort_order_trener >= 0))
szkolenie_trener szkolenie_trener_szkolenie_id_fkey FOREIGN KEY (szkolenie_id) REFERENCES szkolenia(id) ON DELETE CASCADE
szkolenie_trener szkolenie_trener_trener_id_fkey FOREIGN KEY (trener_id) REFERENCES trenerzy(id) ON DELETE CASCADE
trenerzy trenerzy_areas_check CHECK (((areas <@ ARRAY['AI'::text, 'ESG'::text, 'Angielski'::text, 'Software'::text, 'B+R'::text]) AND (array_length(areas, 1) >= 1) AND (array_length(areas, 1) <= 5)))
trenerzy trenerzy_bio_check CHECK ((length(btrim(bio)) > 0))
trenerzy trenerzy_education_check CHECK ((jsonb_typeof(education) = 'array'::text))
trenerzy trenerzy_experience_check CHECK ((jsonb_typeof(experience) = 'array'::text))
trenerzy trenerzy_id_check CHECK ((id ~ '^[a-z0-9][a-z0-9-]*$'::text))
trenerzy trenerzy_initials_check CHECK ((length(btrim(initials)) > 0))
trenerzy trenerzy_name_check CHECK ((length(btrim(name)) > 0))
trenerzy trenerzy_pkey PRIMARY KEY (id)
trenerzy trenerzy_role_check CHECK ((length(btrim(role)) > 0))
trenerzy trenerzy_sort_order_check CHECK ((sort_order >= 0))
trenerzy trenerzy_sort_order_key UNIQUE (sort_order)
trenerzy trenerzy_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
trenerzy trenerzy_tagline_check CHECK ((length(btrim(tagline)) > 0))
user_roles user_roles_pkey PRIMARY KEY (user_id, role)
user_roles user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE$$,
  'ograniczenia public jak w chmurze'
);

-- 3. Indeksy: pg_indexes.
select is(
  (select string_agg(indexdef, E'\n' order by tablename, indexname)
   from pg_indexes where schemaname = 'public'),
  $$CREATE INDEX szkolenia_cat_idx ON public.szkolenia USING btree (cat)
CREATE UNIQUE INDEX szkolenia_pkey ON public.szkolenia USING btree (id)
CREATE UNIQUE INDEX szkolenia_sort_order_key ON public.szkolenia USING btree (sort_order)
CREATE INDEX szkolenia_status_sort_idx ON public.szkolenia USING btree (status, sort_order)
CREATE UNIQUE INDEX szkolenie_trener_pkey ON public.szkolenie_trener USING btree (szkolenie_id, trener_id)
CREATE INDEX szkolenie_trener_szkolenie_idx ON public.szkolenie_trener USING btree (szkolenie_id)
CREATE INDEX szkolenie_trener_trener_idx ON public.szkolenie_trener USING btree (trener_id)
CREATE UNIQUE INDEX trenerzy_pkey ON public.trenerzy USING btree (id)
CREATE UNIQUE INDEX trenerzy_sort_order_key ON public.trenerzy USING btree (sort_order)
CREATE INDEX trenerzy_status_sort_idx ON public.trenerzy USING btree (status, sort_order)
CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id, role)$$,
  'indeksy public jak w chmurze'
);

-- 4. Polityki: pg_policies (user_roles bez polityk).
-- M2, ADR-003: różnica wobec chmury — para *_select_publiczne (anon, authenticated) i *_select_staff
-- (authenticated) zastąpiona przez *_select_anon i *_select_authenticated (jedna zasada SELECT na rolę,
-- W-09); zasady INSERT, UPDATE, DELETE jak w chmurze.
select is(
  (select string_agg(tablename || ' ' || policyname || ' ' || permissive || ' ' || cmd || ' '
      || roles::text || ' USING ' || coalesce(qual, '-') || ' CHECK ' || coalesce(with_check, '-'),
      E'\n' order by tablename, policyname)
   from pg_policies where schemaname = 'public'),
  $$szkolenia szkolenia_delete_staff PERMISSIVE DELETE {authenticated} USING is_staff() CHECK -
szkolenia szkolenia_insert_staff PERMISSIVE INSERT {authenticated} USING - CHECK is_staff()
szkolenia szkolenia_select_anon PERMISSIVE SELECT {anon} USING (status = 'published'::text) CHECK -
szkolenia szkolenia_select_authenticated PERMISSIVE SELECT {authenticated} USING ((status = 'published'::text) OR ( SELECT is_staff() AS is_staff)) CHECK -
szkolenia szkolenia_update_staff PERMISSIVE UPDATE {authenticated} USING is_staff() CHECK is_staff()
szkolenie_trener szt_delete_staff PERMISSIVE DELETE {authenticated} USING is_staff() CHECK -
szkolenie_trener szt_insert_staff PERMISSIVE INSERT {authenticated} USING - CHECK is_staff()
szkolenie_trener szt_select_anon PERMISSIVE SELECT {anon} USING ((EXISTS ( SELECT 1
   FROM szkolenia s
  WHERE ((s.id = szkolenie_trener.szkolenie_id) AND (s.status = 'published'::text)))) AND (EXISTS ( SELECT 1
   FROM trenerzy t
  WHERE ((t.id = szkolenie_trener.trener_id) AND (t.status = 'published'::text))))) CHECK -
szkolenie_trener szt_select_authenticated PERMISSIVE SELECT {authenticated} USING (((EXISTS ( SELECT 1
   FROM szkolenia s
  WHERE ((s.id = szkolenie_trener.szkolenie_id) AND (s.status = 'published'::text)))) AND (EXISTS ( SELECT 1
   FROM trenerzy t
  WHERE ((t.id = szkolenie_trener.trener_id) AND (t.status = 'published'::text))))) OR ( SELECT is_staff() AS is_staff)) CHECK -
szkolenie_trener szt_update_staff PERMISSIVE UPDATE {authenticated} USING is_staff() CHECK is_staff()
trenerzy trenerzy_delete_staff PERMISSIVE DELETE {authenticated} USING is_staff() CHECK -
trenerzy trenerzy_insert_staff PERMISSIVE INSERT {authenticated} USING - CHECK is_staff()
trenerzy trenerzy_select_anon PERMISSIVE SELECT {anon} USING (status = 'published'::text) CHECK -
trenerzy trenerzy_select_authenticated PERMISSIVE SELECT {authenticated} USING ((status = 'published'::text) OR ( SELECT is_staff() AS is_staff)) CHECK -
trenerzy trenerzy_update_staff PERMISSIVE UPDATE {authenticated} USING is_staff() CHECK is_staff()$$,
  'polityki RLS public jak w chmurze, z różnicą M2, ADR-003 (jedna zasada SELECT na rolę)'
);

-- 5. Funkcje (bez funkcji platformy rls_auto_enable): security definer, proconfig, ACL, komentarz, definicja.
-- M2, ADR-003: różnica wobec chmury — is_admin, is_staff, moje_role bez EXECUTE dla PUBLIC i anon (W-08);
-- reszta (treść, security definer, search_path, komentarze, ACL dotknij_updated_at i has_role) jak w chmurze.
select is(
  (select string_agg(p.proname || ' secdef=' || p.prosecdef || ' config=' || coalesce(p.proconfig::text, '-')
      || ' acl=' || coalesce(p.proacl::text, '-') || ' comment='
      || coalesce(obj_description(p.oid, 'pg_proc'), '-') || E'\n' || pg_get_functiondef(p.oid),
      E'\n' order by p.proname)
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname <> 'rls_auto_enable'),
  $$dotknij_updated_at secdef=false config={"search_path=\"\""} acl={=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres} comment=Trigger BEFORE INSERT/UPDATE: utrzymuje updated_at oraz published_at względem kolumny status.
CREATE OR REPLACE FUNCTION public.dotknij_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$

has_role secdef=true config={"search_path=\"\""} acl={postgres=X/postgres,service_role=X/postgres} comment=Czy użytkownik _uid ma rolę _role. Używane w politykach RLS.
CREATE OR REPLACE FUNCTION public.has_role(_uid uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _uid and ur.role = _role
  );
$function$

is_admin secdef=true config={"search_path=\"\""} acl={postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres} comment=-
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.has_role((select auth.uid()), 'admin'::public.app_role);
$function$

is_staff secdef=true config={"search_path=\"\""} acl={postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres} comment=TRUE gdy bieżący użytkownik ma rolę admin lub editor. Brama zapisu treści w politykach RLS.
CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin'::public.app_role, 'editor'::public.app_role)
  );
$function$

moje_role secdef=true config={"search_path=\"\""} acl={postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres} comment=Zwraca role bieżącego użytkownika. Pozwala panelowi poznać własne uprawnienia bez dostępu do tabeli user_roles.
CREATE OR REPLACE FUNCTION public.moje_role()
 RETURNS SETOF app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select ur.role from public.user_roles ur
  where ur.user_id = (select auth.uid());
$function$
$$,
  'funkcje public jak w chmurze (search_path, security definer, ACL, komentarze, treść), z różnicą M2, ADR-003 (ACL funkcji ról)'
);

-- 6. Tabele: RLS, force RLS, ACL, komentarz.
select is(
  (select string_agg(c.relname || ' rls=' || c.relrowsecurity || ' force=' || c.relforcerowsecurity
      || ' acl=' || coalesce(c.relacl::text, '-') || ' comment='
      || coalesce(obj_description(c.oid, 'pg_class'), '-'), E'\n' order by c.relname)
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'),
  $$szkolenia rls=true force=false acl={postgres=arwdDxtm/postgres,anon=r/postgres,authenticated=arwd/postgres,service_role=arwdDxtm/postgres} comment=Oferta szkoleń. Mapuje typ Szkolenie z src/lib/szkolenia/adapter.ts (ISK-34). Publiczny odczyt = tylko published.
szkolenie_trener rls=true force=false acl={postgres=arwdDxtm/postgres,anon=r/postgres,authenticated=arwd/postgres,service_role=arwdDxtm/postgres} comment=Relacja M:N szkolenie↔trener. CASCADE kasuje tylko wiersze przypisań, nigdy encje po drugiej stronie.
trenerzy rls=true force=false acl={postgres=arwdDxtm/postgres,anon=r/postgres,authenticated=arwd/postgres,service_role=arwdDxtm/postgres} comment=Trenerzy. Nowa encja E02 (brak w HEAD). Kolumny wg makiety ZIP. Publiczny odczyt = tylko published.
user_roles rls=true force=true acl={postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres} comment=Źródło prawdy o uprawnieniach redakcyjnych. Zapis wyłącznie przez service_role / SQL (ISKT). Brak drogi samonadania z klienta.$$,
  'tabele public jak w chmurze (RLS, force RLS, granty, komentarze)'
);

-- 7. Wyzwalacze: pg_get_triggerdef.
select is(
  (select string_agg(pg_get_triggerdef(t.oid), E'\n' order by c.relname, t.tgname)
   from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and not t.tgisinternal),
  $$CREATE TRIGGER szkolenia_touch BEFORE INSERT OR UPDATE ON public.szkolenia FOR EACH ROW EXECUTE FUNCTION dotknij_updated_at()
CREATE TRIGGER trenerzy_touch BEFORE INSERT OR UPDATE ON public.trenerzy FOR EACH ROW EXECUTE FUNCTION dotknij_updated_at()$$,
  'wyzwalacze public jak w chmurze'
);

select * from finish();
rollback;
