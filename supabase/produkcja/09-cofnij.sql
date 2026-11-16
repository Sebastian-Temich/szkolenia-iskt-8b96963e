-- 09-cofnij.sql: cofnięcie wdrożenia M4 na produkcji bez kopii zapasowej (ADR-005 pkt 5, W-15, Z3).
--
-- Uruchamia właściciel w SQL Editor dashboardu Supabase tylko przy decyzji o wycofaniu (instrukcja:
-- docs/wydanie/techniczna/produkcja-baza.md, „Rollback”). Całość to jedna instrukcja (blok DO), więc
-- wykonuje się w całości albo wcale. Ponowne uruchomienie jest bezpieczne (idempotentne).
--
-- Co robi:
--   1. odwraca migrację M2 (20261113204457_uprawnienia_funkcji_rol.sql, ADR-003): EXECUTE funkcji
--      is_staff, is_admin, moje_role znowu dla PUBLIC i anon, zasady SELECT jak w migracji bazowej
--      (para *_select_publiczne i *_select_staff zamiast *_select_anon i *_select_authenticated);
--   2. usuwa 9 szkoleń startowych z 02-dane-startowe.sql (po id), ale tylko te bez przypisanych
--      trenerów; szkolenie z przypisaniem zostaje i jest wypisane w wyniku;
--   3. usuwa oba wpisy historii migracji (bazowy z `migration repair` i M2 z `db push`) z
--      supabase_migrations.schema_migrations, czyli wraca do stanu bez historii.
-- Czego NIE robi (świadomie, nie zależy od M2): nie usuwa konta admin ani jego roli, kont redakcji, ich
-- ról editor ani ustawień logowania w dashboardzie. Usuwasz je ręcznie, jeśli chcesz.
-- Po cofnięciu uruchom 01-sprawdz-baze.sql w trybie 'przed-M2': ma dać wynik ZGODNA i pustą historię.

do $cofnij$
declare
  v_startowe constant text[] := array['genai', 'esg', 'eng-b2', 'fullstack', 'ai-agents', 'co2',
                                      'python', 'grants', 'eng-it'];
  v_usuniete int;
  v_zostaly text;
  v_historia int := 0;
begin
  -- 1a. EXECUTE funkcji ról jak przed M2 (stan chmury: PUBLIC, anon, authenticated, service_role).
  grant execute on function public.is_staff(), public.is_admin(), public.moje_role() to public, anon;

  -- 1b. Zasady SELECT jak w migracji bazowej 20261112232552_baza.sql. Najpierw usuwamy obie wersje,
  --     żeby ponowne uruchomienie dało ten sam stan.
  drop policy if exists szkolenia_select_anon on public.szkolenia;
  drop policy if exists szkolenia_select_authenticated on public.szkolenia;
  drop policy if exists szkolenia_select_publiczne on public.szkolenia;
  drop policy if exists szkolenia_select_staff on public.szkolenia;
  create policy szkolenia_select_publiczne on public.szkolenia for select to anon, authenticated
    using (status = 'published');
  create policy szkolenia_select_staff on public.szkolenia for select to authenticated
    using (public.is_staff());

  drop policy if exists trenerzy_select_anon on public.trenerzy;
  drop policy if exists trenerzy_select_authenticated on public.trenerzy;
  drop policy if exists trenerzy_select_publiczne on public.trenerzy;
  drop policy if exists trenerzy_select_staff on public.trenerzy;
  create policy trenerzy_select_publiczne on public.trenerzy for select to anon, authenticated
    using (status = 'published');
  create policy trenerzy_select_staff on public.trenerzy for select to authenticated
    using (public.is_staff());

  drop policy if exists szt_select_anon on public.szkolenie_trener;
  drop policy if exists szt_select_authenticated on public.szkolenie_trener;
  drop policy if exists szt_select_publiczne on public.szkolenie_trener;
  drop policy if exists szt_select_staff on public.szkolenie_trener;
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

  -- 2. Szkolenia startowe bez przypisań trenerów.
  delete from public.szkolenia s
  where s.id = any (v_startowe)
    and not exists (select 1 from public.szkolenie_trener st where st.szkolenie_id = s.id);
  get diagnostics v_usuniete = row_count;
  select string_agg(id, ', ' order by sort_order) into v_zostaly
  from public.szkolenia where id = any (v_startowe);

  -- 3. Historia migracji (tabela może nie istnieć, gdy CLI nigdy nie łączył się z bazą).
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'delete from supabase_migrations.schema_migrations
             where version in (''20261112232552'', ''20261113204457'')';
    get diagnostics v_historia = row_count;
  end if;

  perform set_config('produkcja.cofnij',
    format('usunięte szkolenia startowe: %s; zostały (mają przypisanych trenerów): %s; '
      || 'usunięte wpisy historii migracji: %s', v_usuniete, coalesce(v_zostaly, 'brak'), v_historia),
    false);
end
$cofnij$;

select 'COFNIĘTE' as wynik, current_setting('produkcja.cofnij') as szczegoly;
