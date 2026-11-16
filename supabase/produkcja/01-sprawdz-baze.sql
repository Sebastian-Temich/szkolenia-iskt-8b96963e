-- 01-sprawdz-baze.sql: sprawdzenie bazy produkcyjnej, TYLKO ODCZYT (ADR-005 pkt 1, 2, 9; W-15, W-17).
--
-- Uruchamia właściciel w SQL Editor dashboardu Supabase (instrukcja:
-- docs/wydanie/techniczna/produkcja-baza.md). Skrypt niczego nie zapisuje: transakcja przechodzi w tryb
-- tylko do odczytu, a symulacja ról kończy się przed końcem skryptu.
--
-- Co sprawdza (porównanie z docs/cykle/M1/04-plan/schemat-chmury.md i migracjami z repo):
--   1. schemat public: typy, tabele (RLS, force RLS, granty), kolumny, ograniczenia, indeksy,
--      wyzwalacze, funkcje (treść, security definer, search_path, EXECUTE) i zasady RLS;
--   2. historię migracji (supabase_migrations.schema_migrations);
--   3. symulację ról: gość (anon) widzi tylko opublikowane szkolenia i trenerów, a konto bez roli
--      (losowy UUID) dostaje is_staff() = false.
--
-- Wynik: przy zgodności tabela z kolumną wynik = 'ZGODNA'. Przy niezgodności błąd
-- „NIEZGODNOŚĆ …” z listą różnic: przerwij wdrożenie i przekaż treść błędu (bez haseł).
--
-- =================================== PARAMETR (jedyne miejsce do zmiany) ============================
-- 'przed-M2': przed `supabase migration repair` (stan chmury, pusta historia) i po 09-cofnij.sql
-- 'po-M2':    po `supabase db push` (migracja M2 zastosowana, historia: obie migracje)
select set_config('produkcja.tryb', 'po-M2', false);
-- =====================================================================================================

do $sprawdz$
declare
  v_tryb text := current_setting('produkcja.tryb');
  v_po boolean;
  v_oczekiwane text[];
  v_obecne text[];
  v_bledy text[] := '{}';
  v_historia text := '';
  v_historia_oczekiwana text;
  v_publiczne_szkolenia bigint;
  v_publiczne_trenerzy bigint;
  v_widoczne bigint;
  v_szkice bigint;
  v_funkcja text;
  v_wywolanie text;
  v_wywolanie_oczekiwane text;
  v_uuid uuid := gen_random_uuid();
  v_is_staff boolean;
  v_role bigint;
begin
  -- Bez zapisu do końca transakcji (także przy pomyłce w skrypcie).
  set local transaction_read_only = on;

  if v_tryb not in ('przed-M2', 'po-M2') then
    raise exception 'Nieznany tryb %: wpisz przed-M2 albo po-M2 w PARAMETRZE na górze skryptu', v_tryb;
  end if;
  v_po := v_tryb = 'po-M2';

  -- -------------------------------------------------------------------------------------------------
  -- 1. Schemat public. Linie wspólne dla obu trybów, potem różnice M2 (ADR-003): EXECUTE funkcji ról
  --    dla PUBLIC i anon oraz zasady SELECT (para publiczne/staff przed M2, anon/authenticated po M2).
  --    Długie definicje porównujemy przez md5; różnica wskazuje tabelę albo funkcję.
  -- -------------------------------------------------------------------------------------------------
  v_oczekiwane := array[
    'typ app_role = admin,editor',
    'tabela szkolenia rls=true force=false acl=anon:SELECT,authenticated:DELETE,authenticated:INSERT,authenticated:SELECT,authenticated:UPDATE,postgres:DELETE,postgres:INSERT,postgres:MAINTAIN,postgres:REFERENCES,postgres:SELECT,postgres:TRIGGER,postgres:TRUNCATE,postgres:UPDATE,service_role:DELETE,service_role:INSERT,service_role:MAINTAIN,service_role:REFERENCES,service_role:SELECT,service_role:TRIGGER,service_role:TRUNCATE,service_role:UPDATE',
    'tabela szkolenie_trener rls=true force=false acl=anon:SELECT,authenticated:DELETE,authenticated:INSERT,authenticated:SELECT,authenticated:UPDATE,postgres:DELETE,postgres:INSERT,postgres:MAINTAIN,postgres:REFERENCES,postgres:SELECT,postgres:TRIGGER,postgres:TRUNCATE,postgres:UPDATE,service_role:DELETE,service_role:INSERT,service_role:MAINTAIN,service_role:REFERENCES,service_role:SELECT,service_role:TRIGGER,service_role:TRUNCATE,service_role:UPDATE',
    'tabela trenerzy rls=true force=false acl=anon:SELECT,authenticated:DELETE,authenticated:INSERT,authenticated:SELECT,authenticated:UPDATE,postgres:DELETE,postgres:INSERT,postgres:MAINTAIN,postgres:REFERENCES,postgres:SELECT,postgres:TRIGGER,postgres:TRUNCATE,postgres:UPDATE,service_role:DELETE,service_role:INSERT,service_role:MAINTAIN,service_role:REFERENCES,service_role:SELECT,service_role:TRIGGER,service_role:TRUNCATE,service_role:UPDATE',
    'tabela user_roles rls=true force=true acl=postgres:DELETE,postgres:INSERT,postgres:MAINTAIN,postgres:REFERENCES,postgres:SELECT,postgres:TRIGGER,postgres:TRUNCATE,postgres:UPDATE,service_role:DELETE,service_role:INSERT,service_role:MAINTAIN,service_role:REFERENCES,service_role:SELECT,service_role:TRIGGER,service_role:TRUNCATE,service_role:UPDATE',
    'komentarz tabeli szkolenia md5=b5f2047420ee0d567b0bbe24a5a7142d',
    'komentarz tabeli szkolenie_trener md5=7d4dbf5e51f51a16fede4acd6e254be2',
    'komentarz tabeli trenerzy md5=4a88b256cd9cb210bd5e4f5f3069cdf6',
    'komentarz tabeli user_roles md5=7bc9aa6a6824487d5d7a834139f958d1',
    'kolumny szkolenia md5=f71d79532ee9f8d13b01ac0f739b2190',
    'kolumny szkolenie_trener md5=818de59a7b2f041eb21cecc9be280f6b',
    'kolumny trenerzy md5=613b204dbe762ab45a8b4f0a0bb103bc',
    'kolumny user_roles md5=8eacfc1ee6ad3fe99843c8323d866b3a',
    'ograniczenia szkolenia md5=7804bffc06e9619cbb753eb4db4b4da0',
    'ograniczenia szkolenie_trener md5=88d6861c75899968781c07ad041aacd8',
    'ograniczenia trenerzy md5=e640a3a31c98295bb472d09367f8da63',
    'ograniczenia user_roles md5=52f2eb7616405d82e3c22b30e2e4c4e4',
    'indeksy szkolenia md5=65b2efa3323efcc1dbb4beac93a82961',
    'indeksy szkolenie_trener md5=dbd8fd84ff2ec95cdff2ad2b607b5067',
    'indeksy trenerzy md5=096813643fd3f90a029560c06ddbfc57',
    'indeksy user_roles md5=47d6e5a7475209f5f3a43904f510d444',
    'wyzwalacze szkolenia md5=0b2e33d0044976376ce7bd5b6f0cdbf7',
    'wyzwalacze trenerzy md5=6796167b784235b2a331f3dc87d2d7cb',
    'funkcja dotknij_updated_at() secdef=false config={"search_path=\"\""} acl=PUBLIC:EXECUTE,anon:EXECUTE,authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE md5=ae368d6f43a037f59aa1bdf3ba01fa9f',
    'funkcja has_role(_uid uuid, _role app_role) secdef=true config={"search_path=\"\""} acl=postgres:EXECUTE,service_role:EXECUTE md5=3cde7ad0732a16dbfff834000778089a',
    'polityka szkolenia szkolenia_delete_staff PERMISSIVE DELETE {authenticated} USING is_staff() CHECK -',
    'polityka szkolenia szkolenia_insert_staff PERMISSIVE INSERT {authenticated} USING - CHECK is_staff()',
    'polityka szkolenia szkolenia_update_staff PERMISSIVE UPDATE {authenticated} USING is_staff() CHECK is_staff()',
    'polityka szkolenie_trener szt_delete_staff PERMISSIVE DELETE {authenticated} USING is_staff() CHECK -',
    'polityka szkolenie_trener szt_insert_staff PERMISSIVE INSERT {authenticated} USING - CHECK is_staff()',
    'polityka szkolenie_trener szt_update_staff PERMISSIVE UPDATE {authenticated} USING is_staff() CHECK is_staff()',
    'polityka trenerzy trenerzy_delete_staff PERMISSIVE DELETE {authenticated} USING is_staff() CHECK -',
    'polityka trenerzy trenerzy_insert_staff PERMISSIVE INSERT {authenticated} USING - CHECK is_staff()',
    'polityka trenerzy trenerzy_update_staff PERMISSIVE UPDATE {authenticated} USING is_staff() CHECK is_staff()'
  ];

  if v_po then
    v_oczekiwane := v_oczekiwane || array[
      'funkcja is_admin() secdef=true config={"search_path=\"\""} acl=authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE md5=2c4441518fe60d950b94739890a16342',
      'funkcja is_staff() secdef=true config={"search_path=\"\""} acl=authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE md5=eaa2ba7157306ee741c7ff02f676e84b',
      'funkcja moje_role() secdef=true config={"search_path=\"\""} acl=authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE md5=6fd94446ea29df6c2c03b30473132fc6',
      'polityka szkolenia szkolenia_select_anon PERMISSIVE SELECT {anon} USING (status = ''published''::text) CHECK -',
      'polityka szkolenia szkolenia_select_authenticated PERMISSIVE SELECT {authenticated} USING ((status = ''published''::text) OR ( SELECT is_staff() AS is_staff)) CHECK -',
      'polityka trenerzy trenerzy_select_anon PERMISSIVE SELECT {anon} USING (status = ''published''::text) CHECK -',
      'polityka trenerzy trenerzy_select_authenticated PERMISSIVE SELECT {authenticated} USING ((status = ''published''::text) OR ( SELECT is_staff() AS is_staff)) CHECK -',
      'polityka szkolenie_trener szt_select_anon PERMISSIVE SELECT {anon} USING ((EXISTS ( SELECT 1
   FROM szkolenia s
  WHERE ((s.id = szkolenie_trener.szkolenie_id) AND (s.status = ''published''::text)))) AND (EXISTS ( SELECT 1
   FROM trenerzy t
  WHERE ((t.id = szkolenie_trener.trener_id) AND (t.status = ''published''::text))))) CHECK -',
      'polityka szkolenie_trener szt_select_authenticated PERMISSIVE SELECT {authenticated} USING (((EXISTS ( SELECT 1
   FROM szkolenia s
  WHERE ((s.id = szkolenie_trener.szkolenie_id) AND (s.status = ''published''::text)))) AND (EXISTS ( SELECT 1
   FROM trenerzy t
  WHERE ((t.id = szkolenie_trener.trener_id) AND (t.status = ''published''::text))))) OR ( SELECT is_staff() AS is_staff)) CHECK -'
    ];
  else
    v_oczekiwane := v_oczekiwane || array[
      'funkcja is_admin() secdef=true config={"search_path=\"\""} acl=PUBLIC:EXECUTE,anon:EXECUTE,authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE md5=2c4441518fe60d950b94739890a16342',
      'funkcja is_staff() secdef=true config={"search_path=\"\""} acl=PUBLIC:EXECUTE,anon:EXECUTE,authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE md5=eaa2ba7157306ee741c7ff02f676e84b',
      'funkcja moje_role() secdef=true config={"search_path=\"\""} acl=PUBLIC:EXECUTE,anon:EXECUTE,authenticated:EXECUTE,postgres:EXECUTE,service_role:EXECUTE md5=6fd94446ea29df6c2c03b30473132fc6',
      'polityka szkolenia szkolenia_select_publiczne PERMISSIVE SELECT {anon,authenticated} USING (status = ''published''::text) CHECK -',
      'polityka szkolenia szkolenia_select_staff PERMISSIVE SELECT {authenticated} USING is_staff() CHECK -',
      'polityka trenerzy trenerzy_select_publiczne PERMISSIVE SELECT {anon,authenticated} USING (status = ''published''::text) CHECK -',
      'polityka trenerzy trenerzy_select_staff PERMISSIVE SELECT {authenticated} USING is_staff() CHECK -',
      'polityka szkolenie_trener szt_select_publiczne PERMISSIVE SELECT {anon,authenticated} USING ((EXISTS ( SELECT 1
   FROM szkolenia s
  WHERE ((s.id = szkolenie_trener.szkolenie_id) AND (s.status = ''published''::text)))) AND (EXISTS ( SELECT 1
   FROM trenerzy t
  WHERE ((t.id = szkolenie_trener.trener_id) AND (t.status = ''published''::text))))) CHECK -',
      'polityka szkolenie_trener szt_select_staff PERMISSIVE SELECT {authenticated} USING is_staff() CHECK -'
    ];
  end if;

  select coalesce(array_agg(l order by l collate "C"), '{}') into v_obecne from (
    select 'typ ' || t.typname || ' = ' || string_agg(e.enumlabel, ',' order by e.enumsortorder) as l
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
    group by t.typname
    union all
    select 'tabela ' || c.relname || ' rls=' || c.relrowsecurity || ' force=' || c.relforcerowsecurity
      || ' acl=' || coalesce((select string_agg(x, ',' order by x collate "C") from (
           select case when a.grantee = 0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end
             || ':' || a.privilege_type as x
           from aclexplode(c.relacl) a) s), '-')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
    union all
    select 'komentarz tabeli ' || c.relname || ' md5=' || md5(coalesce(obj_description(c.oid, 'pg_class'), '-'))
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    union all
    select 'kolumny ' || c.relname || ' md5=' || md5(string_agg(a.attnum || ' ' || a.attname || ' | '
        || format_type(a.atttypid, a.atttypmod) || ' | ' || a.attnotnull || ' | '
        || coalesce(pg_get_expr(d.adbin, d.adrelid), '-') || ' | '
        || coalesce(col_description(c.oid, a.attnum), '-'), E'\n' order by a.attnum))
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
    group by c.relname
    union all
    select 'ograniczenia ' || c.relname || ' md5=' || md5(string_agg(k.conname || ' '
        || pg_get_constraintdef(k.oid), E'\n' order by k.conname collate "C"))
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and k.contype in ('c', 'p', 'u', 'f', 'x')
    group by c.relname
    union all
    select 'indeksy ' || tablename || ' md5=' || md5(string_agg(indexdef, E'\n' order by indexname collate "C"))
    from pg_indexes where schemaname = 'public'
    group by tablename
    union all
    select 'wyzwalacze ' || c.relname || ' md5=' || md5(string_agg(pg_get_triggerdef(t.oid), E'\n'
        order by t.tgname collate "C"))
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and not t.tgisinternal
    group by c.relname
    union all
    select 'funkcja ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') secdef='
      || p.prosecdef || ' config=' || coalesce(p.proconfig::text, '-') || ' acl='
      || coalesce((select string_agg(x, ',' order by x collate "C") from (
           select case when a.grantee = 0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end
             || ':' || a.privilege_type as x
           from aclexplode(p.proacl) a) s), '-')
      || ' md5=' || md5(pg_get_functiondef(p.oid) || coalesce(obj_description(p.oid, 'pg_proc'), '-'))
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    -- rls_auto_enable to funkcja platformy Supabase (schemat-chmury.md), nie część migracji.
    where n.nspname = 'public' and p.proname <> 'rls_auto_enable'
    union all
    select 'polityka ' || tablename || ' ' || policyname || ' ' || permissive || ' ' || cmd || ' '
      || roles::text || ' USING ' || coalesce(qual, '-') || ' CHECK ' || coalesce(with_check, '-')
    from pg_policies where schemaname = 'public'
  ) q;

  -- BRAK: oczekiwane, a nie ma w bazie; NADMIAR: jest w bazie, a nie oczekiwano.
  v_bledy := v_bledy
    || array(select r from (select 'BRAK: ' || l as r from unnest(v_oczekiwane) l
                            except select 'BRAK: ' || l from unnest(v_obecne) l) b
             order by r collate "C")
    || array(select r from (select 'NADMIAR: ' || l as r from unnest(v_obecne) l
                            except select 'NADMIAR: ' || l from unnest(v_oczekiwane) l) n
             order by r collate "C");

  -- -------------------------------------------------------------------------------------------------
  -- 2. Historia migracji: przed M2 pusta (albo brak tabeli), po M2 dokładnie migracja bazowa i M2.
  -- -------------------------------------------------------------------------------------------------
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select coalesce(string_agg(version, '','' order by version), '''')
             from supabase_migrations.schema_migrations' into v_historia;
  end if;
  v_historia_oczekiwana := case when v_po then '20261112232552,20261113204457' else '' end;
  if v_historia <> v_historia_oczekiwana then
    v_bledy := v_bledy || format('historia migracji: jest [%s], oczekiwano [%s]',
      v_historia, v_historia_oczekiwana);
  end if;

  -- -------------------------------------------------------------------------------------------------
  -- 3. Symulacja ról (W-17, ADR-005 pkt 9). Właściciel tabel widzi wszystkie wiersze (RLS bez force),
  --    więc liczba opublikowanych to punkt odniesienia dla gościa.
  -- -------------------------------------------------------------------------------------------------
  select count(*) into v_publiczne_szkolenia from public.szkolenia where status = 'published';
  select count(*) into v_publiczne_trenerzy from public.trenerzy where status = 'published';
  if exists (select 1 from public.user_roles where user_id = v_uuid) then
    raise exception 'Losowy UUID % ma rolę; uruchom skrypt ponownie', v_uuid;
  end if;

  -- Gość (anon).
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select count(*), count(*) filter (where status <> 'published') into v_widoczne, v_szkice
  from public.szkolenia;
  if v_szkice <> 0 or v_widoczne <> v_publiczne_szkolenia then
    v_bledy := v_bledy || format('anon: widzi %s szkoleń (w tym %s szkiców), opublikowanych jest %s',
      v_widoczne, v_szkice, v_publiczne_szkolenia);
  end if;
  select count(*), count(*) filter (where status <> 'published') into v_widoczne, v_szkice
  from public.trenerzy;
  if v_szkice <> 0 or v_widoczne <> v_publiczne_trenerzy then
    v_bledy := v_bledy || format('anon: widzi %s trenerów (w tym %s szkiców), opublikowanych jest %s',
      v_widoczne, v_szkice, v_publiczne_trenerzy);
  end if;
  -- Po M2 gość nie ma EXECUTE na funkcjach ról (W-08); przed M2 ma (stan chmury).
  v_wywolanie_oczekiwane := case when v_po then 'odmowa' else 'wywołuje' end;
  foreach v_funkcja in array array['is_staff', 'is_admin', 'moje_role'] loop
    begin
      execute format('select count(*) from public.%I()', v_funkcja);
      v_wywolanie := 'wywołuje';
    exception when insufficient_privilege then
      v_wywolanie := 'odmowa';
    end;
    if v_wywolanie <> v_wywolanie_oczekiwane then
      v_bledy := v_bledy || format('anon: %s() — %s, oczekiwano: %s', v_funkcja, v_wywolanie,
        v_wywolanie_oczekiwane);
    end if;
  end loop;
  reset role;

  -- Zalogowane konto bez roli (losowy UUID).
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_uuid, 'role', 'authenticated')::text, true);
  select public.is_staff() into v_is_staff;
  select count(*) into v_role from public.moje_role();
  select count(*) filter (where status <> 'published') into v_szkice from public.szkolenia;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  if v_is_staff is distinct from false or v_role <> 0 or v_szkice <> 0 then
    v_bledy := v_bledy || format('konto bez roli: is_staff()=%s, role=%s, widoczne szkice=%s '
      || '(oczekiwano false, 0, 0)', v_is_staff, v_role, v_szkice);
  end if;

  -- -------------------------------------------------------------------------------------------------
  -- Wynik
  -- -------------------------------------------------------------------------------------------------
  if cardinality(v_bledy) > 0 then
    raise exception E'NIEZGODNOŚĆ (tryb %): % różnic. Przerwij wdrożenie i przekaż ten komunikat.\n%',
      v_tryb, cardinality(v_bledy), array_to_string(v_bledy, E'\n');
  end if;

  perform set_config('produkcja.historia', v_historia, false);
  perform set_config('produkcja.opublikowane', v_publiczne_szkolenia::text, false);
end
$sprawdz$;

select
  current_setting('produkcja.tryb') as tryb,
  'ZGODNA' as wynik,
  nullif(current_setting('produkcja.historia'), '') as historia_migracji,
  current_setting('produkcja.opublikowane')::int as opublikowane_szkolenia;
