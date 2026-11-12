# ADR-001: Budowa bazy 1:1 z chmury i testy RLS

Status: proponowana
Data: 2026-11-13

## Kontekst

Repo nie ma `supabase/` ani migracji; budowa bazy istnieje tylko w projekcie Supabase w chmurze, bez
historii migracji (`list_migrations` = 0). Raport analizy (`docs/00-analiza/raport.md`, „Lovable i
Supabase”) opisuje ją z odczytu katalogu 2026-11-12: tabele `szkolenia`, `trenerzy`,
`szkolenie_trener`, `user_roles`, enum `app_role`, funkcje `is_staff`, `is_admin`, `moje_role`,
`has_role`, `dotknij_updated_at`, wyzwalacze, polityki RLS i granty. Właściciel zgodził się na odczyt
chmury przez MCP Supabase (tylko odczyt, `decyzje.md`). Bazy w chmurze nie zmieniamy. Specyfikacja M1:
W-02 (budowa 1:1, porównanie), W-05 (testy RLS), Z4 (poprawki advisora poza M1).

## Decyzja

1. Jedna migracja bazowa `supabase/migrations/<ts>_baza.sql`, napisana ręcznie z odczytu katalogu
   chmury (DDL tabel z CHECK, komentarzami i domyślnymi, PK/UNIQUE/FK z `ON DELETE CASCADE`, indeksy,
   enum, funkcje z `security definer` i `search_path = ''`, wyzwalacze, `enable row level security`,
   polityki, granty i `revoke` zgodne z chmurą). Odczyt chmury wykonuje orkiestrator przez MCP i
   przekazuje workerowi wynik jako dane w issue/komentarzu (worker nie ma dostępu do chmury).
   Alternatywny źródłowy zrzut `supabase db dump --schema-only` od właściciela nie jest potrzebny.
2. Zgodność (W-02/K2) sprawdza porównanie wyników tych samych zapytań katalogowych (`information_schema.
   columns`, `pg_constraint`, `pg_indexes`, `pg_policies`, `pg_proc` z `prosecdef`/`proconfig`,
   `information_schema.role_table_grants`, `routine_privileges`) na chmurze (orkiestrator, MCP) i na
   lokalnej bazie po `shctl db reset` (worker). Różnica w schemacie `public` blokuje zadanie.
3. Testy RLS w pgTAP w `supabase/tests/` (uruchamiane `shctl db test` i w jobie CI `baza`), z
   minimalnymi dowodami: dla roli `anon`, zalogowanego bez roli, `editor` i `admin` — testy pozytywne
   i negatywne odczytu i zapisu każdej tabeli, przypisań do szkiców w obie strony, `user_roles`
   (brak odczytu i zapisu z klienta), funkcji `moje_role`/`is_staff` (tylko własne role), wyzwalacza
   `published_at`.
4. Uwagi advisora (0028/0029: `anon` wywołuje funkcje `security definer`; ochrona przed wyciekniętymi
   hasłami) zostają 1:1 w M1 i trafiają do backlogu jako osobne zlecenie.

## Rozważane opcje

- Zrzut `supabase db dump --schema-only` od właściciela: dokładny DDL, ale wymaga hasła bazy
  produkcyjnej u właściciela i zbędnego kroku ręcznego; odrzucone, bo odczyt MCP jest już dozwolony.
- Odtworzenie z kodu aplikacji: bez polityk i funkcji; odrzucone.
- Poprawki advisora od razu: zmieniają zachowanie względem chmury przed przenosinami; odłożone (Z4).

## Konsekwencje

- Lokalna baza i przyszła produkcja powstaną z tej samej migracji; zgodność z chmurą jest
  udokumentowana porównaniem w raporcie zadania.
- Migracja bazowa nie jest nigdy edytowana (AGENTS.md, „Migracje”); kolejne zmiany to nowe migracje.
- `config.toml`: blok portów 55421–55429, `enable_signup = false` (rejestracji nie ma w panelu).
