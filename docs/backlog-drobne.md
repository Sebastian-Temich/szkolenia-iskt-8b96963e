# Backlog drobnych uwag

Plik wspólny, aktualizuje orkiestrator. Zgłoszenia ⚪ z review i „Drobne uwagi” z raportów.

| Data | Źródło | Uwaga | Stan |
|---|---|---|---|
| 2026-11-13 | T-6 | `README.md` i `.lovable/plan/…` mogą wspominać bun; poza zakresem (README w zadaniu M1). | otwarta |
| 2026-11-13 | T-6 | Build ostrzega, że `vite-tsconfig-paths` jest zbędny przy natywnym `resolve.tsconfigPaths` (stan wyjściowy). | otwarta |
| 2026-11-13 | T-6 | Przestarzałe paczki: `eslint@9.39.5` (deprecated), `recharts@2.15.4` (deprecated) oraz pośrednie `abab`, `domexception`, `tsconfck`, `whatwg-encoding`; poza zakresem (aktualizacje paczek). | otwarta |
| 2026-11-13 | T-6 | pnpm 12 wypisuje „Agent skills awaiting approval: @tanstack/react-start, @tanstack/router-plugin. Run "pnpm approve"”: nie zatwierdzałem; nie wpływa na instalację ani testy. | otwarta |
| 2026-11-13 | T-7 | `shctl db` w kopii roboczej (`/Users/Shared/sh/stan/db/szkolenia-iskt`) zapisuje sekcję `[inbucket]`, więc CLI 2.121.0 ostrzega „config section [inbucket] is deprecated”. To nie jest plik repo. W CLI 3.x ta sekcja będzie błędem. | otwarta |
| 2026-11-13 | T-7 | Ostrzeżenie „no files matched pattern: supabase/seed.sql” zniknie po T3 (seed). | otwarta |
| 2026-11-13 | T-8 | `site_url` w `supabase/config.toml` to `http://127.0.0.1:3000`, a `pnpm dev` serwuje port 8080. Logowanie hasłem tego nie używa, ale linki z e-maili auth (reset hasła) wskazywałyby zły adres. Poza zakresem (plik spoza listy, porty bloku). | otwarta |
| 2026-11-13 | T-8 | `shctl db reset` ostrzega „config section [inbucket] is deprecated” (kopia robocza shctl, jak w T-7). | otwarta |
| 2026-11-13 | T-9 | `shctl db` ostrzega „config section [inbucket] is deprecated” (jak w T-7 i T-8). | otwarta |
| 2026-11-13 | T-9 | Advisor 0028/0029 (`anon` wywołuje `is_staff`, `is_admin`, `moje_role` jako `security definer`) zostaje 1:1 z chmurą (ADR-001 pkt 4); testy K4 potwierdzają, że funkcje te nie ujawniają cudzych ról. | otwarta |
| 2026-11-13 | T-10 | `docs/wydanie/DoD.md` wymaga „Wdrożenie przez `scripts/deploy-prod.sh` opisane”; w M1 bez deployu, opisane jako nie dotyczy w sekcji „Wdrożenie”. | otwarta |
| 2026-11-13 | review PR #17 | `docs/wydanie/techniczna/M1.md` i `produktowa/M1.md` zapowiadają O-9 i „QA kamienia M1” jako przyszłe, a QA M1 jest już zrobione (PASS, `raport-M1.md`): uaktualnić odwołania. | otwarta |
| 2026-11-13 | review PR #17 | `techniczna/M1.md`, wiersz #9 T4: „4 pliki pgTAP”, a jest 5 plików RLS plus testy schematu i seedu: ujednolicić. | otwarta |
| 2026-11-13 | review PR #24 | T6 (#25): cel dopuszcza warunkową poprawkę `src/lib/panel/sesja.ts` (Z2), a `pliki` jej nie wymieniają; przy poprawce traktować jako dozwoloną celem. | otwarta |
| 2026-11-13 | QA M1 | (przyczyna: test) Brak Playwright i joba CI `e2e` mimo kontraktu stacku; ścieżki UI sprawdzają tylko vitest na atrapie i test ręczny. Osobne zlecenie: Playwright chromium + webkit, smoke `/`, `/szkolenia`, `/trenerzy`, `/panel` na lokalnym Supabase w CI; zastąpić `tests/e2e/szkolenia.py`. | otwarta |
| 2026-11-13 | T-18 | `src/components/ui/dialog.tsx`: przycisk zamknięcia ma angielską etykietę „Close” (sr-only); plik spoza zakresu, nie zmieniony. Warto spolszczyć („Zamknij”) w osobnym zadaniu. | otwarta |
| 2026-11-13 | T-18 | `harness-routera.tsx` (`zamontujTrase`) montuje aplikację z `<html>`/`<body>` w `<div>` (ostrzeżenie „<html> cannot be a child of <div>”) — przyczyna zawieszeń testów z oknami Radix. Wspólny helper z korzeniem na `document` uprościłby testy paneli (`panel-szkolenia-usuwanie` i inne obchodzą to `fireEvent` i podziałem plików). | otwarta |
| 2026-11-13 | T-18 | `ProfilTrenera.tsx` ma podobny przycisk „Zapytaj o termin”, który nadal prowadzi poza stronę — poza zakresem. | otwarta |
| 2026-11-13 | review PR #19 | Raport błędnie deklaruje, że wcześniejszy wybór nie wraca po ponownym wczytaniu listy. Stan wybrane pozostaje niezmieniony, więc po sekwencji wybór python → błąd → sukces pole ponownie pokaże python. Popraw opis na zgodny z implementacją; wymagany stan podczas błędu działa poprawnie. (`docs/07-realizacja/T-18.md:112`) | otwarta |
| 2026-11-13 | T-20 | Do poprawki osobnym zadaniem (dostępność, waga axe serious): link logo w nagłówku z nazwą dostępną bez widocznego tekstu (`Header.tsx`) i za niski kontrast numerów kroków „Jak to działa” (`JakToDziala.tsx`, `--green-200`). Po poprawce: usunąć wpis z `ZNANE_BLEDY` i `fixme` z testu w `e2e/dostepnosc.spec.ts`. | otwarta |
| 2026-11-13 | review PR #21 | Poza CI działa wyłącznie reporter list, więc lokalny przebieg nie tworzy raportu HTML wymaganego przez instrukcję `playwright show-report` w README.md:123. Włącz reporter HTML również lokalnie albo uzupełnij instrukcję uruchomienia o `--reporter=list,html`. (`playwright.config.ts:21`) | otwarta |
| 2026-11-13 | T-25 | Komentarz w bazowej migracji (`20261112232552_baza.sql`, linie 205–207) mówi, że funkcje ról zostają z domyślnym `EXECUTE` dla `PUBLIC` i `anon`. Od tej migracji jest nieaktualny, ale istniejących migracji się nie zmienia, a stan bieżący opisuje komentarz nowej migracji. | otwarta |
| 2026-11-13 | T-26 | `shctl db` wypisuje „WARN: config section [inbucket] is deprecated … use [local_smtp]”, choć `supabase/config.toml` ma `[local_smtp]`; na serwerze działa Supabase CLI v2.121.0, a nagłówek `config.toml` mówi o szablonie z CLI 3.1.0. Ostrzeżenie pochodzi z kopii roboczej shctl (`/Users/Shared/sh/stan/db/szkolenia-iskt`), której worker nie może czytać. | otwarta |
| 2026-11-13 | T-26 | `docs/decyzje.md` (wpis T-8 z 2026-11-13) ma stare hasła testowe; orkiestrator może dopisać nowszą decyzję przy zamknięciu tego zadania. | otwarta |
| 2026-11-13 | T-27 | Job `e2e` nie biegnie na pushu na `main`, więc kryterium „e2e zielone na `main`” da się spełnić tylko pośrednio (PR) albo ręcznym `workflow_dispatch` orkiestratora. | otwarta |
| 2026-11-13 | T-27 | ADR-003 ma status „proponowana”, choć plan zaakceptowano i migracja jest na `main`. | otwarta |
