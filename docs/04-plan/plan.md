# Plan: szkolenia-iskt, cykl M4-produkcja (krok 1: baza)

Źródło: `docs/00-intake/specyfikacja.md` (cykl M4, rewizja 6969d0c). Wymagania W-15…W-17. Plany
poprzednich cykli w `docs/cykle/*/04-plan/plan.md`; architektura aplikacji bez zmian.

## Architektura

Bez zmian w aplikacji. Zmiana dotyczy bazy produkcyjnej (projekt Supabase vwnvbhiuundeunyzhdxj):
przyjęcie istniejącego schematu do historii migracji, wgranie migracji M2, dane startowe, ustawienia
logowania i role redakcji. Narzędzia: skrypty SQL w nowym katalogu `supabase/produkcja/` i instrukcja
dla właściciela.

### Moduły i punkty wejścia

| Moduł / funkcja | Punkt wejścia (strona, trasa, komenda, endpoint) | Design (pliki) | Wymagania |
|---|---|---|---|
| Sprawdzenie bazy (przed i po M2) | `supabase/produkcja/01-sprawdz-baze.sql` (SQL Editor, tylko odczyt) | brak | W-15 |
| Historia migracji i M2 | `supabase migration repair --status applied 20261112232552`, `supabase db push` (CLI właściciela) | brak | W-15 |
| Dane startowe | `supabase/produkcja/02-dane-startowe.sql` (SQL Editor) | istniejący katalog `/szkolenia` | W-16 |
| Role redakcji | `supabase/produkcja/03-role.sql` (SQL Editor), konta z dashboardu | istniejący panel `/panel` | W-17 |
| Ustawienia logowania | dashboard Supabase: Authentication → URL Configuration, Sign In / Providers | brak | W-17 |
| Cofnięcie | `supabase/produkcja/09-cofnij.sql` (SQL Editor) | brak | W-15 |
| Instrukcja | `docs/wydanie/techniczna/produkcja-baza.md` | brak | W-15…W-17 |

### Model danych

Bez nowych migracji. Migracje zgodne wstecz (expand/contract) bez zmian jako zasada; produkcja dostaje
istniejące migracje M1 (oznaczona jako zastosowana) i M2 (wykonana). Dane startowe: 9 szkoleń z repo,
idempotentnie, bez trenerów.

### Integracje

Brak nowych. Supabase CLI u właściciela.

### Bezpieczeństwo

- Auth i role: ADR-003 w produkcji (anon bez funkcji ról, jedna zasada odczytu na rolę); konta
  redakcji z rolą editor; rejestracja wyłączona; wymagania haseł jak lokalnie.
- Dane osobowe: e-maile kont tylko w auth Supabase i w SQL Editor właściciela, nie w repo.
- Sekrety: hasło bazy tylko interaktywnie w CLI właściciela; brak poświadczeń produkcji w repo, CI i u
  agentów (ADR-005 pkt 6, 8).

### Środowiska i droga na produkcję

Produkcja bazy: projekt vwnvbhiuundeunyzhdxj (plan darmowy). Aplikacja na Vercel w kolejnym kroku;
do tego czasu nic nie korzysta z produkcji (Lovable nie ma zmiennej tej bazy). Automatyczne wdrażanie
migracji z CI: osobna decyzja w kroku Vercel (ADR-005 pkt 8).

### Decyzje

- [ADR-005: Wdrożenie bazy produkcyjnej na istniejącym projekcie Supabase](adr/ADR-005-wdrozenie-bazy-produkcyjnej.md)
- Bez zmian: ADR-002, ADR-003, ADR-004. ADR-001: zasada „baza w chmurze bez zmian” zastąpiona przez ADR-005.

## Kamienie milowe

| Nr | Kamień milowy | Rezultat | Wymagania | Warunek startu |
|---|---|---|---|---|
| M4 | Baza produkcyjna | Skrypty produkcji z testami w CI, instrukcja; właściciel wykonuje ją na projekcie vwnvbhiuundeunyzhdxj; sprawdzenie tylko do odczytu potwierdza schemat, dane i role; dokumentacja wydania M4 | W-15, W-16, W-17 | Plan zaakceptowany |

Kamień M4 kontynuuje numerację projektu. Szkielet istnieje (M1), więc bez zadania szkieletu. Zadania
(rozpisuje 06-zadania, ID od T12): skrypty `supabase/produkcja/` z testami w CI i instrukcja → (wykonanie
przez właściciela, zadanie właściciela) → dokumentacja wydania M4 z wynikiem sprawdzenia.

## Zadania właściciela

| Zadanie | Przed | Uwagi |
|---|---|---|
| Wykonać instrukcję `produkcja-baza.md` (sprawdzenie, repair, db push, dane, ustawienia, konta, role) | QA M4 | CLI zainstalowane i zalogowane (lista startowa) |
| Utworzyć 2 konta redakcji w dashboardzie i przekazać hasła osobnym kanałem | nadaniem ról | Z4 |
| Vercel, klucze w Vercel, domena, automatyczne wdrażanie migracji | kolejnym krokiem (cykl Vercel) | nie dotyczy M4 |

## Ryzyka

| Ryzyko | Skutek | Działanie (ADR, spike, dowody) | Właściciel |
|---|---|---|---|
| Schemat chmury różni się od migracji bazowej | `repair` wpisuje nieprawdę, M2 pada | `01-sprawdz-baze.sql` przed repair; przy różnicy stop | właściciel, orkiestrator |
| M2 pada w połowie | Niespójne uprawnienia | Migracja w transakcji (CLI); `09-cofnij.sql` testowany w CI | worker T12, właściciel |
| Sekret lub e-mail w repo | Wyciek | Skrypty z przykładowymi adresami `example.com`, gitleaks w CI | worker T12, review |
| Plan darmowy usypia bazę | Strona bez danych po 7 dniach bez ruchu | Znane ryzyko; decyzja o Pro przy starcie Vercel | właściciel |

## Scenariusze odbioru

| Nr | Scenariusz | Kroki | Oczekiwany wynik | Wymagania | Kamień |
|---|---|---|---|---|---|
| O-25 | Sprawdzenie przed zmianą | `01-sprawdz-baze.sql` na produkcji | Zgodność z migracją bazową | W-15 | M4 |
| O-26 | Historia i M2 | `migration repair`, `db push`, `supabase migration list` | Obie migracje zastosowane w produkcji | W-15 | M4 |
| O-27 | Uprawnienia po M2 | `01-sprawdz-baze.sql` „po M2”; odczyt MCP orkiestratora | anon bez funkcji ról, 1 zasada odczytu na rolę | W-15 | M4 |
| O-28 | Dane startowe | `02-dane-startowe.sql` dwa razy | 9 opublikowanych szkoleń, bez duplikatów i trenerów | W-16 | M4 |
| O-29 | Konta i role | 2 konta z dashboardu, `03-role.sql`; odczyt MCP | 2 × editor, 1 × admin | W-17 | M4 |
| O-30 | Ustawienia logowania | Dashboard: Site URL, Redirect URLs, rejestracja, hasła | Wartości jak w instrukcji (zrzut ekranu albo potwierdzenie właściciela) | W-17 | M4 |
| O-31 | Cofnięcie (CI) | Job `baza`: `09-cofnij.sql`, sprawdzenie „przed M2”, ponowne M2 | Zielone | W-15 | M4 |

## Zakres autoryzacji

Po akceptacji orkiestrator zapisuje go w `decyzje.md` przez `shctl decision add --rola wlasciciel`.

- Na co: kamień M4 (zadania z `06-zadania`, ID od T12) i instrukcja dla właściciela.
- Zakres: `supabase/produkcja/`, testy w CI, `docs/wydanie/`, `AGENTS.md` (zasada bazy produkcyjnej);
  bez zmian aplikacji, migracji i `config.toml`; bez dostępu agentów do produkcji.
- Do kiedy: do odbioru M4.
- Wymaga nowej decyzji właściciela: zmiana planu Supabase, automatyczne wdrażanie z CI (sekret w
  GitHub), Vercel i domena, usunięcie danych produkcji poza `09-cofnij.sql`.

## Gotowość środowiska

`shctl doctor` 2026-11-15T15:06Z: 0 błędów (bez zmian środowiska od tego czasu). Projekt Supabase
ACTIVE_HEALTHY (2026-11-16). Lista startowa M4 kompletna (CLI właściciela zalogowane 2026-11-16).

## Następny krok

Orkiestrator: review etapu 04-plan, potem akceptacja właściciela.
