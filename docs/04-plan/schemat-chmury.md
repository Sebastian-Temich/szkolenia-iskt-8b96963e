# Schemat bazy w chmurze (odczyt katalogu)

Odczyt tylko do odczytu przez MCP Supabase, projekt `szkolenia-isk` (eu-central-1, Postgres 17),
2026-11-12/13, zgoda właściciela w `docs/decyzje.md`. Źródło dla migracji bazowej (ADR-001).
Bez danych (wszystkie tabele mają 0 wierszy) i bez sekretów. Obiekty platformy Supabase poza
schematem `public` (auth, storage, event triggery `ensure_rls`, `pgrst_*`, `issue_*`) i funkcja
platformy `public.rls_auto_enable()` nie wchodzą do migracji: tworzy je platforma.

## Typy

```sql
create type public.app_role as enum ('admin', 'editor');
```

## Tabele (kolumny w kolejności)

### public.szkolenia

Komentarz: „Oferta szkoleń. Mapuje typ Szkolenie z src/lib/szkolenia/adapter.ts (ISK-34). Publiczny odczyt = tylko published.” RLS: tak, force: nie.

| Kolumna | Typ | Not null | Domyślna | Komentarz |
|---|---|---|---|---|
| id | text | tak | | Stabilny identyfikator = segment URL /szkolenia/$id. Nie zmieniać — zachowuje linki E01. |
| sort_order | integer | tak | | |
| cat | text | tak | | |
| icon | text | tak | | |
| title | text | tak | | |
| level | text | tak | | |
| hours | text | tak | | |
| format | text | tak | | |
| price | integer | tak | | |
| badge | text | nie | | |
| fundable | boolean | tak | false | |
| opis | text | tak | | Pole `desc` kontraktu (desc = zarezerwowane w SQL). Objęte wyszukiwaniem (title+cat+desc). |
| learn | text[] | tak | | |
| program | jsonb | tak | | |
| for_whom | text | tak | | |
| terms | text[] | nie | | NULL ⇒ TERMINY_DOMYSLNE po stronie frontendu; pusta tablica ⇒ brak terminów. |
| status | text | tak | 'draft' | |
| published_at | timestamptz | nie | | |
| created_at | timestamptz | tak | now() | |
| updated_at | timestamptz | tak | now() | |

Ograniczenia:

```sql
szkolenia_pkey            PRIMARY KEY (id)
szkolenia_sort_order_key  UNIQUE (sort_order)
szkolenia_cat_check       CHECK (cat = ANY (ARRAY['AI','ESG','Angielski','Software','B+R']))
szkolenia_for_whom_check  CHECK (length(btrim(for_whom)) > 0)
szkolenia_format_check    CHECK (length(btrim(format)) > 0)
szkolenia_hours_check     CHECK (length(btrim(hours)) > 0)
szkolenia_icon_check      CHECK (icon = ANY (ARRAY['cpu','leaf','languages','code-xml','flask-conical']))
szkolenia_id_check        CHECK (id ~ '^[a-z0-9][a-z0-9-]*$')
szkolenia_learn_check     CHECK (array_length(learn, 1) >= 1 AND array_length(learn, 1) <= 12)
szkolenia_level_check     CHECK (length(btrim(level)) > 0)
szkolenia_opis_check      CHECK (length(btrim(opis)) > 0)
szkolenia_price_check     CHECK (price >= 0)
szkolenia_program_check   CHECK (jsonb_typeof(program) = 'array' AND jsonb_array_length(program) >= 1 AND jsonb_array_length(program) <= 24)
szkolenia_sort_order_check CHECK (sort_order >= 0)
szkolenia_status_check    CHECK (status = ANY (ARRAY['draft','published']))
szkolenia_title_check     CHECK (length(btrim(title)) > 0)
```

Indeksy: `szkolenia_cat_idx (cat)`, `szkolenia_status_sort_idx (status, sort_order)` (+ PK, UNIQUE).

### public.trenerzy

Komentarz: „Trenerzy. Nowa encja E02 (brak w HEAD). Kolumny wg makiety ZIP. Publiczny odczyt = tylko published.” RLS: tak, force: nie.

| Kolumna | Typ | Not null | Domyślna | Komentarz |
|---|---|---|---|---|
| id | text | tak | | Stabilny identyfikator = segment URL /trenerzy/$id (nowa trasa E02/E). |
| sort_order | integer | tak | | |
| name | text | tak | | |
| initials | text | tak | | |
| role | text | tak | | |
| areas | text[] | tak | | |
| tagline | text | tak | | |
| bio | text | tak | | |
| experience | jsonb | tak | '[]'::jsonb | |
| education | jsonb | tak | '[]'::jsonb | |
| skills | text[] | tak | '{}'::text[] | |
| photo_url | text | nie | | Opcjonalne. Bucket Storage na zdjęcia = decyzja E02/C. Dziś makieta używa inicjałów. |
| status | text | tak | 'draft' | |
| published_at | timestamptz | nie | | |
| created_at | timestamptz | tak | now() | |
| updated_at | timestamptz | tak | now() | |

Ograniczenia:

```sql
trenerzy_pkey             PRIMARY KEY (id)
trenerzy_sort_order_key   UNIQUE (sort_order)
trenerzy_areas_check      CHECK (areas <@ ARRAY['AI','ESG','Angielski','Software','B+R'] AND array_length(areas, 1) >= 1 AND array_length(areas, 1) <= 5)
trenerzy_bio_check        CHECK (length(btrim(bio)) > 0)
trenerzy_education_check  CHECK (jsonb_typeof(education) = 'array')
trenerzy_experience_check CHECK (jsonb_typeof(experience) = 'array')
trenerzy_id_check         CHECK (id ~ '^[a-z0-9][a-z0-9-]*$')
trenerzy_initials_check   CHECK (length(btrim(initials)) > 0)
trenerzy_name_check       CHECK (length(btrim(name)) > 0)
trenerzy_role_check       CHECK (length(btrim(role)) > 0)
trenerzy_sort_order_check CHECK (sort_order >= 0)
trenerzy_status_check     CHECK (status = ANY (ARRAY['draft','published']))
trenerzy_tagline_check    CHECK (length(btrim(tagline)) > 0)
```

Indeksy: `trenerzy_status_sort_idx (status, sort_order)` (+ PK, UNIQUE).

### public.szkolenie_trener

Komentarz: „Relacja M:N szkolenie↔trener. CASCADE kasuje tylko wiersze przypisań, nigdy encje po drugiej stronie.” RLS: tak, force: nie.

| Kolumna | Typ | Not null | Domyślna | Komentarz |
|---|---|---|---|---|
| szkolenie_id | text | tak | | |
| trener_id | text | tak | | |
| sort_order_trener | integer | tak | 0 | Pozycja trenera na liście trenerów danego szkolenia (0-based). Zapis wyłącznie ze strony "szkolenie". |
| created_at | timestamptz | tak | now() | |
| sort_order_szkolenie | integer | tak | 0 | Pozycja szkolenia na liście szkoleń danego trenera (0-based). Zapis wyłącznie ze strony "trener". |

Ograniczenia:

```sql
szkolenie_trener_pkey                          PRIMARY KEY (szkolenie_id, trener_id)
szkolenie_trener_szkolenie_id_fkey             FOREIGN KEY (szkolenie_id) REFERENCES szkolenia(id) ON DELETE CASCADE
szkolenie_trener_trener_id_fkey                FOREIGN KEY (trener_id) REFERENCES trenerzy(id) ON DELETE CASCADE
szkolenie_trener_sort_order_szkolenie_nieujemny CHECK (sort_order_szkolenie >= 0)
szkolenie_trener_sort_order_trener_nieujemny   CHECK (sort_order_trener >= 0)
```

Indeksy: `szkolenie_trener_szkolenie_idx (szkolenie_id)`, `szkolenie_trener_trener_idx (trener_id)` (+ PK).

Uwaga: kolumna `sort_order_szkolenie` jest piąta (dodana po `created_at`); migracja może dodać ją
w tej samej kolejności, żeby porównanie kolumn było identyczne.

### public.user_roles

Komentarz: „Źródło prawdy o uprawnieniach redakcyjnych. Zapis wyłącznie przez service_role / SQL (ISKT). Brak drogi samonadania z klienta.” RLS: tak, **force: tak**.

| Kolumna | Typ | Not null | Domyślna |
|---|---|---|---|
| user_id | uuid | tak | |
| role | public.app_role | tak | |
| created_at | timestamptz | tak | now() |

```sql
user_roles_pkey          PRIMARY KEY (user_id, role)
user_roles_user_id_fkey  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
```

## Funkcje

Wszystkie z `SET search_path TO ''`.

```sql
CREATE OR REPLACE FUNCTION public.dotknij_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO ''
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
$function$;
-- komentarz: Trigger BEFORE INSERT/UPDATE: utrzymuje updated_at oraz published_at względem kolumny status.

CREATE OR REPLACE FUNCTION public.has_role(_uid uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _uid and ur.role = _role
  );
$function$;
-- komentarz: Czy użytkownik _uid ma rolę _role. Używane w politykach RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select public.has_role((select auth.uid()), 'admin'::public.app_role);
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin'::public.app_role, 'editor'::public.app_role)
  );
$function$;
-- komentarz: TRUE gdy bieżący użytkownik ma rolę admin lub editor. Brama zapisu treści w politykach RLS.

CREATE OR REPLACE FUNCTION public.moje_role()
 RETURNS SETOF app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select ur.role from public.user_roles ur
  where ur.user_id = (select auth.uid());
$function$;
-- komentarz: Zwraca role bieżącego użytkownika. Pozwala panelowi poznać własne uprawnienia bez dostępu do tabeli user_roles.
```

Uprawnienia EXECUTE (ACL):

| Funkcja | ACL |
|---|---|
| dotknij_updated_at | PUBLIC, postgres, anon, authenticated, service_role |
| has_role | **tylko** postgres, service_role (revoke od PUBLIC, anon, authenticated) |
| is_admin | PUBLIC, postgres, anon, authenticated, service_role |
| is_staff | PUBLIC, postgres, anon, authenticated, service_role |
| moje_role | PUBLIC, postgres, anon, authenticated, service_role |

Uwaga: `is_admin` wywołuje `has_role` jako właściciel (`security definer`), więc działa mimo braku
EXECUTE dla `authenticated` na `has_role`.

## Wyzwalacze

```sql
CREATE TRIGGER szkolenia_touch BEFORE INSERT OR UPDATE ON public.szkolenia FOR EACH ROW EXECUTE FUNCTION dotknij_updated_at();
CREATE TRIGGER trenerzy_touch  BEFORE INSERT OR UPDATE ON public.trenerzy  FOR EACH ROW EXECUTE FUNCTION dotknij_updated_at();
```

## Granty na tabelach (ACL)

| Tabela | anon | authenticated | service_role |
|---|---|---|---|
| szkolenia | SELECT | SELECT, INSERT, UPDATE, DELETE | wszystko |
| trenerzy | SELECT | SELECT, INSERT, UPDATE, DELETE | wszystko |
| szkolenie_trener | SELECT | SELECT, INSERT, UPDATE, DELETE | wszystko |
| user_roles | — | — | wszystko |

Domyślne granty Supabase dla `anon`/`authenticated` (wszystko) były w chmurze odebrane: migracja
musi zrobić `revoke all ... from anon, authenticated` i nadać tylko powyższe.

## Polityki RLS (wszystkie PERMISSIVE)

| Tabela | Polityka | Komenda | Role | USING | WITH CHECK |
|---|---|---|---|---|---|
| szkolenia | szkolenia_select_publiczne | SELECT | anon, authenticated | `status = 'published'` | |
| szkolenia | szkolenia_select_staff | SELECT | authenticated | `is_staff()` | |
| szkolenia | szkolenia_insert_staff | INSERT | authenticated | | `is_staff()` |
| szkolenia | szkolenia_update_staff | UPDATE | authenticated | `is_staff()` | `is_staff()` |
| szkolenia | szkolenia_delete_staff | DELETE | authenticated | `is_staff()` | |
| trenerzy | trenerzy_select_publiczne | SELECT | anon, authenticated | `status = 'published'` | |
| trenerzy | trenerzy_select_staff | SELECT | authenticated | `is_staff()` | |
| trenerzy | trenerzy_insert_staff | INSERT | authenticated | | `is_staff()` |
| trenerzy | trenerzy_update_staff | UPDATE | authenticated | `is_staff()` | `is_staff()` |
| trenerzy | trenerzy_delete_staff | DELETE | authenticated | `is_staff()` | |
| szkolenie_trener | szt_select_publiczne | SELECT | anon, authenticated | `EXISTS (SELECT 1 FROM szkolenia s WHERE s.id = szkolenie_trener.szkolenie_id AND s.status = 'published') AND EXISTS (SELECT 1 FROM trenerzy t WHERE t.id = szkolenie_trener.trener_id AND t.status = 'published')` | |
| szkolenie_trener | szt_select_staff | SELECT | authenticated | `is_staff()` | |
| szkolenie_trener | szt_insert_staff | INSERT | authenticated | | `is_staff()` |
| szkolenie_trener | szt_update_staff | UPDATE | authenticated | `is_staff()` | `is_staff()` |
| szkolenie_trener | szt_delete_staff | DELETE | authenticated | `is_staff()` | |
| user_roles | (brak) | | | | |

## Rozszerzenia

`pg_stat_statements`, `pgcrypto`, `uuid-ossp`, `supabase_vault`, `plpgsql` — standard platformy,
migracja ich nie tworzy.

## Zapytania do porównania (W-02/K2)

Te same zapytania uruchamia orkiestrator na chmurze i worker na lokalnej bazie; wynik w schemacie
`public` ma być identyczny:

1. kolumny: `pg_attribute` (nazwa, `format_type`, `attnotnull`, `pg_get_expr` domyślnej,
   `col_description`), kolejność po `attnum`;
2. ograniczenia: `pg_get_constraintdef` z `pg_constraint` (typy c, p, u, f);
3. indeksy: `pg_indexes`;
4. polityki: `pg_policies`;
5. funkcje: `prosecdef`, `proconfig`, `pg_get_functiondef`, `proacl` (bez `rls_auto_enable`);
6. tabele: `relrowsecurity`, `relforcerowsecurity`, `relacl`, `obj_description`;
7. wyzwalacze: `pg_get_triggerdef`.
