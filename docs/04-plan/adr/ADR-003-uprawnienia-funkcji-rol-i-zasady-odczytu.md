# ADR-003: Uprawnienia funkcji ról i jedna zasada odczytu na rolę

Status: proponowana
Data: 2026-11-13

## Kontekst

Migracja bazowa (ADR-001) odtwarza 1:1 chmurę: `is_staff()`, `is_admin()`, `moje_role()` są
`security definer` i wywoływalne przez `anon` i `PUBLIC` (advisor 0028/0029), a `szkolenia`,
`trenerzy`, `szkolenie_trener` mają dla `authenticated` po dwie permisywne zasady SELECT
(`*_select_publiczne` dla anon i authenticated oraz `*_select_staff` dla authenticated; advisor 0006).
Specyfikacja M2: W-08 (goście bez funkcji ról), W-09 (jedna zasada odczytu na rolę), W-11 (testy,
udokumentowane różnice wobec chmury). Ograniczenie: zasada oceniana dla `anon` nie może wołać
`is_staff()`, bo po W-08 `anon` traci `EXECUTE` (błąd 42501 zamiast pustego wyniku).

## Decyzja

1. Nowa migracja (expand): `revoke execute on function public.is_staff(), public.is_admin(),
   public.moje_role() from public, anon;` — `authenticated` i `service_role` zachowują `EXECUTE`;
   `has_role` bez zmian (tylko `service_role`).
2. W tej samej migracji, dla każdej z trzech tabel treści: usunięcie pary
   `*_select_publiczne` (anon, authenticated) i `*_select_staff` (authenticated) i utworzenie:
   - `*_select_anon` (`to anon`, `using (status = 'published')`; dla `szkolenie_trener` warunek
     EXISTS obu końców opublikowanych, bez funkcji ról),
   - `*_select_authenticated` (`to authenticated`, `using (<warunek publiczny> or (select
     public.is_staff()))`).
   Zbiór widocznych wierszy dla każdej roli jest identyczny jak przed zmianą (suma dwóch dawnych
   zasad). `(select …)` dla `is_staff()` zgodnie z zaleceniem Supabase (jedno wywołanie na zapytanie).
3. Zasady INSERT, UPDATE, DELETE bez zmian.
4. Test zgodności `schemat_chmury.test.sql` od M2 sprawdza „chmura + udokumentowane różnice”:
   oczekiwane wartości ACL funkcji ról i listy polityk są zmienione z komentarzem `-- M2, ADR-003`;
   reszta katalogu bez zmian.
5. Dowody (minimalne dla Auth i RLS): pgTAP pozytywne i negatywne dla anon, zalogowanego bez roli,
   `editor`, `admin`: odmowa `EXECUTE` dla anon (42501), wyniki funkcji ról dla zalogowanych bez zmian,
   widoczność szkiców i opublikowanych jak przed zmianą (istniejące testy RLS bez zmian oczekiwań),
   test liczący zasady SELECT na rolę i tabelę w `pg_policies` (≤ 1), advisor `db advisors` z
   poziomem warn bez 0006 (raport zadania).

## Rozważane opcje

- Jedna zasada `to anon, authenticated` z warunkiem `auth.role() = 'authenticated' and is_staff()`:
  Postgres nie gwarantuje skrótu w ocenie warunku, więc `anon` mógłby i tak wywołać `is_staff()` →
  ryzyko 42501; odrzucone.
- Funkcje ról jako `security invoker` z zasadą SELECT na `user_roles`: zmienia model „brak drogi do
  `user_roles` z klienta”; odrzucone.
- Pozostawienie 0028/0029: funkcje nie ujawniają cudzych ról (testy M1), ale zbędna powierzchnia API;
  odrzucone zgodnie ze zleceniem.

## Konsekwencje

- Baza z migracji odbiega od chmury w dwóch świadomych punktach; przy przenosinach nowa produkcja
  powstaje z migracji, a obecna chmura zostaje bez zmian.
- Kod aplikacji bez zmian (panel woła funkcje ról tylko z sesją — Z2); weryfikacja: vitest i E2E.
- Migracja zgodna wstecz: aplikacja z M1 działa na nowym schemacie (te same wiersze, te same funkcje
  dla zalogowanych).
