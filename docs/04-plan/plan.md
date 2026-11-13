# Plan: szkolenia-iskt, cykl M2-bezpieczenstwo

Źródło: `docs/00-intake/specyfikacja.md` (cykl M2). Wymagania W-08…W-11. Plan M1 i jego
architektura: `docs/cykle/M1/04-plan/plan.md` (bez zmian poza poniższym).

## Architektura

Bez zmian w aplikacji. Zmiana dotyczy wyłącznie bazy (nowa migracja), konfiguracji logowania
lokalnie i testów.

### Moduły i punkty wejścia

| Moduł / funkcja | Punkt wejścia (strona, trasa, komenda, endpoint) | Design (pliki) | Wymagania |
|---|---|---|---|
| Uprawnienia funkcji ról | RPC `moje_role`, `is_staff`, `is_admin` (PostgREST), nowa migracja w `supabase/migrations/` | brak (bez UI) | W-08 |
| Zasady odczytu treści | PostgREST `szkolenia`, `trenerzy`, `szkolenie_trener`; nowa migracja | brak | W-09 |
| Konfiguracja logowania | `supabase/config.toml` `[auth]`; logowanie w `/panel` | brak (ekrany bez zmian) | W-10 |
| Testy | `supabase/tests/` (`shctl db test`, job `baza`), vitest, E2E (`e2e/`, job `e2e`) | brak | W-11 |

### Model danych

Bez zmian tabel. Nowa migracja zmienia ACL funkcji ról i zasady SELECT (ADR-003). Migracje zgodne
wstecz (expand/contract): aplikacja z M1 działa na nowym schemacie; istniejących migracji nie
zmieniamy.

### Integracje

Brak.

### Bezpieczeństwo

- Auth: `site_url` na `http://localhost:8080`, wymagania haseł lokalnie (W-10); rejestracja dalej
  wyłączona. Konta testowe z nowymi hasłami tylko lokalnie (Z1).
- Dostęp do danych: ADR-003 — anon bez funkcji ról, jedna zasada odczytu na rolę, zapis bez zmian.
- Sekrety i dane osobowe: brak zmian.

### Środowiska i droga na produkcję

Jak w M1 (lokalnie, CI na runnerach GitHuba, brak stagingu). Migracja M2 trafia do chmury dopiero w
zleceniu przenosin; obecnej bazy nie zmieniamy.

### Decyzje

- [ADR-003: Uprawnienia funkcji ról i jedna zasada odczytu na rolę](adr/ADR-003-uprawnienia-funkcji-rol-i-zasady-odczytu.md)
- Bez zmian: ADR-001 (baza z migracji), ADR-002 (pnpm).

## Kamienie milowe

| Nr | Kamień milowy | Rezultat | Wymagania | Warunek startu |
|---|---|---|---|---|
| M2 | Bezpieczeństwo bazy | Migracja uprawnień i zasad z testami; konfiguracja logowania z nowymi hasłami testowymi; dokumentacja wydania M2 (lista migracji, plan rollbacku); CI zielone | W-08…W-11 | Plan zaakceptowany |

Kamień M2 kontynuuje numerację projektu (M1 w archiwum cyklu). Szkielet projektu (narzędzia, CI,
baza z migracji, E2E) powstał w M1 i #20, więc cykl zmiany nie ma zadania szkieletu: pierwsze
zadanie korzysta z istniejącego. Zadania (rozpisuje 06-zadania, ID od T6): migracja uprawnień i
zasad z testami pgTAP → konfiguracja logowania, seed, README i E2E → dokumentacja wydania M2
(`docs/wydanie/techniczna/M2.md`, `produktowa/M2.md`: lista migracji z migracją M2, plan rollbacku,
różnice wobec chmury). Kolejno, bo dzielą jeden stack `shctl db` i test zgodności schematu.

## Zadania właściciela

| Zadanie | Przed | Uwagi |
|---|---|---|
| Konta prod, staging, `STAGING_DB_URL`, DNS, zmienne prod | zleceniem przenosin | nie dotyczy M2 |
| Odbiór M2 | odbiorem | serwis i panel jak dziś, nowe hasło testowe redaktora |

## Ryzyka

| Ryzyko | Skutek | Działanie (ADR, spike, dowody) | Właściciel |
|---|---|---|---|
| Zasada dla anon woła funkcję bez EXECUTE | Goście dostają błąd zamiast oferty | ADR-003: osobna zasada anon bez funkcji ról; test anon i E2E stron publicznych | worker T6, review |
| Zmiana zbioru widocznych wierszy | Wyciek szkiców albo zniknięcie treści | Istniejące testy RLS bez zmian oczekiwań + nowy test liczby zasad | worker T6 |
| Nowe wymagania haseł blokują konta testowe | Panel lokalnie i E2E nie logują | Seed, README i E2E z nowymi hasłami w jednym zadaniu (T7) | worker T7 |
| Rozjazd z chmurą | Mylący test zgodności | ADR-003 pkt 4: różnice oznaczone w teście | orkiestrator |

## Scenariusze odbioru

| Nr | Scenariusz | Kroki | Oczekiwany wynik | Wymagania | Kamień |
|---|---|---|---|---|---|
| O-11 | Gość nie woła funkcji ról | pgTAP jako anon: `is_staff()`, `moje_role()` | odmowa 42501 | W-08 | M2 |
| O-12 | Panel redaktora | `/panel`, logowanie redaktorem nowym hasłem z README | lista szkoleń, edycja działa | W-08, W-10 | M2 |
| O-13 | Konto bez roli | `/panel`, `bez-roli@szkolenia.local` | „Brak uprawnień” | W-08, W-10 | M2 |
| O-14 | Oferta dla gościa | `/szkolenia`, `/trenerzy` bez logowania | 9 szkoleń, 6 trenerów, szkice ukryte | W-09 | M2 |
| O-15 | Jedna zasada na rolę | test pgTAP `pg_policies`, `db advisors` z poziomem warn | ≤ 1 zasada SELECT na rolę i tabelę, brak 0006 | W-09 | M2 |
| O-16 | Regresja | CI na `main`: `jakosc`, `baza`, `e2e` | zielone | W-11 | M2 |

## Zakres autoryzacji

Po akceptacji orkiestrator zapisuje go w `decyzje.md` przez `shctl decision add --rola wlasciciel`.

- Na co: kamień M2 (zadania z `06-zadania`).
- Zakres: W-08…W-11; nowe migracje w repo; `config.toml`, seed, README, testy; bez zmian w chmurze,
  Lovable, Vercel; bez płatnych usług.
- Do kiedy: do odbioru M2.
- Wymaga nowej decyzji właściciela: zmiany w kodzie aplikacji poza minimalną poprawką z Z2, zapis do
  bazy w chmurze, publikacja.

## Gotowość środowiska

Jak przy M1 (`shctl doctor` 2026-11-12T23:01Z: 0 błędów); Docker i `shctl db` działały dziś w
zadaniach #18 i #20. Lista startowa M2: wszystko „nie dotyczy”.

## Następny krok

Orkiestrator: review etapu 04-plan, potem akceptacja właściciela.
