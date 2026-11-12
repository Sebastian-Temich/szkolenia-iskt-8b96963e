# Plan: szkolenia-iskt, zlecenie M1 „Projekt uruchomiony lokalnie z bazą z repo”

Źródło: `docs/00-intake/specyfikacja.md` w rewizji 3bc25da. Wymagania przywołujemy numerami `W-NN`.
Etap `04-plan`: krótka architektura i plan kamieni milowych w jednym dokumencie. Zadania rozpisuje
etap `06-zadania` (`docs/06-zadania/zadania.yaml`).

## Architektura

Aplikacja się nie zmienia (W-07): TanStack Start z SSR, dane przez Supabase JS z kluczem publishable,
autoryzacja wyłącznie w RLS (raport analizy, „Architektura obecna”). M1 dodaje wokół niej narzędzia
(pnpm), bazę w repo (`supabase/`), dane startowe, testy bazy i CI.

### Moduły i punkty wejścia

| Moduł / funkcja | Punkt wejścia (strona, trasa, komenda, endpoint) | Design (pliki) | Wymagania |
|---|---|---|---|
| Instalacja i skrypty projektu | `pnpm install`, `pnpm dev|test|typecheck|lint|build` | brak (bez UI) | W-01 |
| Budowa bazy | `supabase/migrations/`, `supabase/config.toml`; `shctl db start|reset` | `docs/04-plan/schemat-chmury.md` | W-02 |
| Dane startowe i konta testowe | `supabase/seed.sql`; `shctl db reset` | dane z `src/lib/szkolenia/mock-dane.ts`, `src/test/dane-z-makiety-trenerzy.ts` | W-03 |
| Uruchomienie lokalne | `README.md` „Uruchomienie lokalne”; `pnpm dev` → `/`, `/szkolenia`, `/trenerzy`, `/panel` | istniejące ekrany (karty F-01…F-08 w `docs/00-analiza/funkcje/`) | W-04 |
| Testy zasad dostępu | `supabase/tests/*.sql`; `shctl db test`, job CI `baza` | brak | W-05 |
| CI | `.github/workflows/ci.yml` (joby `jakosc`, `baza`), obok `sh.yml` | brak | W-06 |
| Regresja | `pnpm test` (22 pliki, 230 testów), przegląd diffu `src/` | karty F-01…F-08 | W-07 |

### Model danych

Model 1:1 z chmury, opisany w `docs/04-plan/schemat-chmury.md` (ADR-001): `szkolenia`, `trenerzy`,
`szkolenie_trener`, `user_roles`, enum `app_role`, funkcje ról i wyzwalacz `dotknij_updated_at`.
Jedna migracja bazowa; kolejne zmiany to nowe migracje. Migracje są zgodne wstecz
(expand/contract): poprzednia wersja aplikacji działa na nowym schemacie, istniejących plików
migracji nie zmieniamy. Seed (`supabase/seed.sql`) tylko dla bazy lokalnej i CI, nigdy dla produkcji.

### Integracje

Brak nowych. Supabase lokalnie (Docker, `shctl db`); odczyt katalogu chmury przez MCP wyłącznie przez
orkiestratora i wyłącznie do odczytu (porównanie W-02/K2).

### Bezpieczeństwo

- Auth: e-mail i hasło Supabase, bez rejestracji (`enable_signup = false` w `config.toml`). Konta
  testowe tylko w seedzie lokalnym: `redaktor@szkolenia.local` (rola `editor`) i
  `bez-roli@szkolenia.local`; hasła testowe jawne w README z dopiskiem „tylko lokalnie”.
- Dostęp do danych: RLS 1:1 z chmurą, testy pgTAP pozytywne i negatywne dla anon, bez roli, editor,
  admin (ADR-001).
- Sekrety: brak kluczy chmury na serwerze i w repo; `.env.local` z kluczami lokalnego stacku z
  `shctl db status`; `.env.example` bez wartości.
- Dane osobowe: brak (trenerzy z makiet fikcyjni, decyzja właściciela 2026-11-12).

### Środowiska i droga na produkcję

| Środowisko | Opis w tym projekcie |
|---|---|
| LOCAL | Supabase przez `shctl db` (Docker na serwerze), blok portów 55421–55429; `pnpm dev` |
| PREVIEW | Brak w M1 (Lovable i Vercel poza zakresem) |
| STAGING | Brak w M1; CI uruchamia migracje i pgTAP na chwilowej bazie w jobie `baza` |
| PROD | Lovable + obecna baza w chmurze, bez zmian; publikuje tylko właściciel |

Odstępstwa od drogi na produkcję z `proces-v1.md`: brak stagingu i preview w M1; `STAGING_DB_URL` nie
jest potrzebny. Migracja na bazę produkcyjną w chmurze i przeniesienie na Vercel to osobne,
ostatnie zlecenie (decyzja właściciela 2026-11-12).

### Decyzje

- [ADR-001: Budowa bazy 1:1 z chmury i testy RLS](adr/ADR-001-baza-1-1-z-chmury-i-testy-rls.md)
- [ADR-002: Przejście z bun na pnpm](adr/ADR-002-przejscie-z-bun-na-pnpm.md)

## Kamienie milowe

Jeden kamień: projekt przejęty ma działającą aplikację, więc „szkielet” to tu narzędzia i CI (T1), a
pionowy przekrój kamienia to ścieżka „właściciel uruchamia serwis z bazą z repo i widzi pełną ofertę”.

| Nr | Kamień milowy | Rezultat | Wymagania | Warunek startu |
|---|---|---|---|---|
| M1 | Uruchomienie lokalne z bazą z repo | pnpm i CI zielone; baza z migracji 1:1 z chmurą; dane startowe; serwis i panel działają lokalnie według README; testy RLS zielone; dokumentacja wydania | W-01…W-07 | Plan zaakceptowany (delegacja właściciela 2026-11-13), lista startowa kompletna |

Kolejność zadań (rozpisuje 06-zadania): narzędzia i CI → migracja bazowa → dane startowe i
uruchomienie lokalne → testy RLS → dokumentacja wydania. Zadania bazy idą kolejno (jeden stack
`shctl db` na projekt).

## Zadania właściciela

| Zadanie | Przed | Uwagi |
|---|---|---|
| Docker Desktop włączony na serwerze | startem realizacji | potwierdzone 2026-11-12 (lista startowa) |
| Konta prod (Vercel, Supabase prod UE) | zleceniem przenosin | nie dotyczy M1 |
| Projekt Supabase staging, `STAGING_DB_URL` | — | nie dotyczy M1 (brak stagingu) |
| Domena i DNS, zmienne prod w Vercel | zleceniem przenosin | nie dotyczy M1 |
| Odbiór M1: uruchomienie według README | odbiorem | 15 min |

## Ryzyka

| Ryzyko | Skutek | Działanie (ADR, spike, dowody) | Właściciel |
|---|---|---|---|
| Migracja niezgodna z chmurą | Nowa produkcja inna niż obecna | ADR-001: porównanie katalogu (W-02/K2), blokuje zadanie | orkiestrator |
| Luka w RLS przy odtwarzaniu | Szkice albo zapis bez roli | ADR-001: pgTAP pozytywne i negatywne dla 4 ról w CI | worker T4, review |
| Inne wersje paczek po pnpm | Regresja aplikacji | ADR-002: wyniki stanu wyjściowego jako kryterium T1 | worker T1 |
| Lovable buduje inaczej po pnpm | Publikacja w Lovable może się nie udać | Ryzyko przyjęte do przenosin; publikuje tylko właściciel | właściciel |
| Jeden stack `shctl db` naraz | Zadania bazy blokują się wzajemnie | Zadania bazy w kolejności zależności | orkiestrator |
| Supabase CLI 3.x zmienia `config.toml` (`[inbucket]`) | Ostrzeżenia przy aktualizacji CLI | Zostajemy na zainstalowanej wersji CLI; zmiana przy aktualizacji systemu | builder sh-system |

## Scenariusze odbioru

Odbiór lokalny na serwerze (brak stagingu w M1).

| Nr | Scenariusz | Kroki | Oczekiwany wynik | Wymagania | Kamień |
|---|---|---|---|---|---|
| O-1 | Instalacja | `pnpm install --frozen-lockfile` w czystym klonie | sukces, brak `bun.lock` | W-01 | M1 |
| O-2 | Baza od zera | `shctl db start`, `shctl db reset` | migracja i seed bez błędów | W-02, W-03 | M1 |
| O-3 | Zgodność z chmurą | porównanie zapytań katalogowych (raport T2) | brak różnic w `public` | W-02 | M1 |
| O-4 | Serwis lokalnie | kroki README, otwarcie `/` i `/szkolenia` | 4 polecane, 9 szkoleń w katalogu | W-03, W-04 | M1 |
| O-5 | Trenerzy | `/trenerzy`, profil trenera, szczegół szkolenia | 6 trenerów, prowadzący przy szkoleniach | W-03, W-04 | M1 |
| O-6 | Panel redaktora | `/panel`, logowanie `redaktor@szkolenia.local` | lista szkoleń, edycja i publikacja działają | W-03, W-04 | M1 |
| O-7 | Konto bez roli | `/panel`, logowanie `bez-roli@szkolenia.local` | ekran „Brak uprawnień” | W-03, W-04 | M1 |
| O-8 | Baza wyłączona | `shctl db stop`, odświeżenie `/szkolenia` | „Nie udało się wczytać katalogu” i „Spróbuj ponownie” | W-04 | M1 |
| O-9 | CI | PR z celowo zepsutym testem albo migracją (QA po merge'u) | job czerwony; na `main` joby zielone | W-05, W-06 | M1 |
| O-10 | Regresja | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` na `main` | 230 testów zielonych, 0 błędów | W-07 | M1 |

## Zakres autoryzacji

Po akceptacji orkiestrator zapisuje go w `decyzje.md` przez `shctl decision add --rola wlasciciel`.

- Na co: kamień M1 (zadania z `06-zadania`).
- Zakres: W-01…W-07; lokalna baza przez `shctl db`; odczyt katalogu chmury przez MCP wyłącznie do
  porównania; CI na darmowych runnerach GitHuba; bez płatnych usług i nowych kont.
- Do kiedy: do odbioru M1.
- Wymaga nowej decyzji właściciela: jakikolwiek zapis do bazy w chmurze, publikacja w Lovable, Vercel,
  zmiany funkcji serwisu, poprawki advisora Supabase, aktualizacje paczek poza wymuszonymi przez pnpm.

## Gotowość środowiska

`shctl doctor --json` 2026-11-12T23:01Z: 0 błędów; Docker działa, herdr i orkiestrator działają, gh,
claude i codex zalogowani, 21 GB wolnego miejsca. Uwagi bez wpływu na M1: klon docs w Obsidianie
różni się od origin (synchronizacja), repo `sh-test-adopt` do usunięcia.

## Następny krok

Orkiestrator: review etapu 04-plan, akceptacja w ramach delegacji właściciela, potem rozpisanie zadań
(06-zadania).
