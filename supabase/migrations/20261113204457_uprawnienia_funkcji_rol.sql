-- M2, ADR-003 (T6, #25): goście bez funkcji ról (W-08) i jedna zasada odczytu na rolę (W-09).
-- Expand: zbiór widocznych wierszy dla każdej roli bez zmian (suma dawnych dwóch zasad SELECT);
-- funkcje ról dla authenticated i service_role bez zmian. Zasady INSERT, UPDATE, DELETE bez zmian.

-- ---------------------------------------------------------------------------------------------
-- W-08: funkcje ról niedostępne dla gościa (advisor 0028/0029). has_role bez zmian.
-- ---------------------------------------------------------------------------------------------

revoke execute on function public.is_staff(), public.is_admin(), public.moje_role() from public, anon;

-- ---------------------------------------------------------------------------------------------
-- W-09: jedna permisywna zasada SELECT na rolę i tabelę (advisor 0006).
-- Zasada dla anon nie woła funkcji ról (anon nie ma już EXECUTE: błąd 42501 zamiast pustego wyniku).
-- ---------------------------------------------------------------------------------------------

-- szkolenia
drop policy szkolenia_select_publiczne on public.szkolenia;
drop policy szkolenia_select_staff on public.szkolenia;
create policy szkolenia_select_anon on public.szkolenia for select to anon
  using (status = 'published');
create policy szkolenia_select_authenticated on public.szkolenia for select to authenticated
  using (status = 'published' or (select public.is_staff()));

-- trenerzy
drop policy trenerzy_select_publiczne on public.trenerzy;
drop policy trenerzy_select_staff on public.trenerzy;
create policy trenerzy_select_anon on public.trenerzy for select to anon
  using (status = 'published');
create policy trenerzy_select_authenticated on public.trenerzy for select to authenticated
  using (status = 'published' or (select public.is_staff()));

-- szkolenie_trener: przypisanie widoczne publicznie, gdy obie strony są opublikowane.
drop policy szt_select_publiczne on public.szkolenie_trener;
drop policy szt_select_staff on public.szkolenie_trener;
create policy szt_select_anon on public.szkolenie_trener for select to anon
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
create policy szt_select_authenticated on public.szkolenie_trener for select to authenticated
  using (
    (
      exists (
        select 1 from public.szkolenia s
        where s.id = szkolenie_trener.szkolenie_id and s.status = 'published'
      )
      and exists (
        select 1 from public.trenerzy t
        where t.id = szkolenie_trener.trener_id and t.status = 'published'
      )
    )
    or (select public.is_staff())
  );
