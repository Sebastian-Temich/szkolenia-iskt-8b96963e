# Analiza projektu: szkolenia-iskt

Repo: Sebastian-Temich/szkolenia-iskt-8b96963e · Analiza: 2026-11-12T13:31Z – 2026-11-12T13:50Z (UTC) · Limit: 120 min

# Dla właściciela

## Stan w jednym akapicie

Serwis szkolenia.iskt.pl to publiczna strona oferty szkoleń ISKT (strona główna, katalog szkoleń z
filtrami, szczegół szkolenia z ceną i terminami, lista trenerów i ich profile) oraz panel
redakcyjny, w którym zalogowany redaktor dodaje, edytuje, publikuje i usuwa szkolenia oraz trenerów
i przypisuje trenerów do szkoleń. Aplikacja powstała w Lovable w dniach 16–28 października 2026 i
od tego czasu nikt jej nie zmieniał. Kod jest uporządkowany i dobrze pokryty testami (ostatni pomiar:
230 testów, wszystkie zielone), ale w repozytorium nie ma żadnej definicji bazy danych: tabele,
zasady dostępu i funkcje ról istnieją tylko w chmurze. Dlatego nie da się dziś postawić aplikacji z
lokalną bazą ani sprawdzić, czy wersje robocze treści są naprawdę ukryte przed gośćmi. Pierwszym
krokiem jest zrzut schematu bazy od Ciebie; z niego zrobimy pierwszą migrację w repo i lokalną bazę.

## Co działa

- Strona główna z sekcjami, przełącznikiem „Dla Ciebie / Dla firm”, polecanymi szkoleniami z bazy i
  formularzem kontaktu (formularz tylko wygląda, niczego nie wysyła). Dowód: testy treści i formularza.
- Katalog szkoleń z filtrem kategorii, wyszukiwaniem i adresem do udostępnienia; stany ładowania,
  pustego wyniku i błędu. Dowód: testy katalogu i scenariusz ręczny QA.
- Szczegół szkolenia: program, efekty, odbiorcy, cena z dofinansowaniem i bez, terminy, prowadzący,
  strona „nie znaleziono”. Dowód: testy szczegółu i cen.
- Lista trenerów i profil trenera z prowadzonymi szkoleniami. Dowód: testy trenerów.
- Panel redakcyjny: logowanie e-mailem i hasłem, sprawdzenie roli, listy z filtrem, formularze,
  publikacja i wycofanie, usuwanie z potwierdzeniem, przypisania trenerów z kolejnością. Dowód: testy
  panelu (na atrapie bazy, nie na prawdziwej bazie).
- Wersja produkcyjna działa na Lovable (wg Twojej informacji).

## Czego brakuje

- Definicji bazy w repozytorium (tabele, zasady dostępu, funkcje ról, dane startowe): bez tego nie
  ma lokalnej bazy ani przenosin na nowy projekt Supabase.
- Automatycznych testów w GitHubie (brak CI): testy uruchamiał tylko Lovable i ręcznie QA.
- Testów na prawdziwej bazie: czy gość nie widzi szkiców i czy osoba bez roli nie może nic zapisać,
  sprawdzamy dziś tylko na atrapie.
- Wysyłki formularza kontaktu i zapisów na szkolenie (przyciski prowadzą do formularza, który nic nie
  wysyła).
- Wgrywania zdjęć trenerów (jest tylko pole na adres zdjęcia z internetu).
- Instrukcji uruchomienia lokalnego i opisu projektu (opis w repo to szablon Lovable).

## Ryzyka

| Ryzyko | Waga | Co proponujemy |
|---|---|---|
| Schemat bazy żyje tylko w chmurze i nie jest w pełni zgodny z tym, co widzi Lovable | 🔴 | Zrzut schematu od Ciebie, z niego pierwsza migracja w repo; od tej pory źródłem prawdy są migracje w repo |
| Nie wiemy, czy zasady dostępu w bazie ukrywają szkice i blokują zapis osobom bez roli (aplikacja filtruje szkice sama, ale klucz publiczny pozwala pytać bazę bezpośrednio) | 🔴 | Przegląd zasad dostępu na zrzucie i testy na lokalnej bazie przed upublicznieniem repo |
| Plik z adresem bazy i kluczem publicznym jest w repozytorium | 🟡 | To klucz publiczny (nie administratora), więc nie trzeba go unieważniać; usuwamy plik z repo w adaptacji, a stara baza i tak zostanie zastąpiona nową |
| Każda zmiana na głównej gałęzi trafia do edytora Lovable, a przycisk „Publikuj” w Lovable wypuściłby ją na produkcję | 🟡 | Nie pracujemy w Lovable i nie publikujemy bez Twojej decyzji; główna gałąź zawsze stabilna |
| Brak CI: zmiana może coś zepsuć bez sygnału | 🟡 | CI (lint, typy, testy, build) w adaptacji |
| Formularz kontaktu wygląda na działający, a nic nie wysyła | 🟡 | Na produkcji klienci mogą myśleć, że wysłali zgłoszenie; osobne zlecenie na wysyłkę albo informacja na stronie |
| Szkolenia bez własnych terminów pokazują terminy domyślne z września i października 2026, czyli już minione | 🟡 | Na produkcji sprawdzić, które szkolenia nie mają własnych terminów; zmiana terminów domyślnych jako pierwsze drobne zlecenie po M1 |
| Polecane szkolenia na stronie głównej są wybrane na stałe w kodzie (cztery konkretne) | ⚪ | Gdy któreś zostanie wycofane, sekcja pokaże mniej pozycji; wybór polecanych w panelu jako przyszłe zlecenie |
| Część pakietów w wersjach beta lub mocno nieaktualnych | ⚪ | Przegląd w CI, aktualizacje jako drobne zlecenia |

## Pytania do Ciebie

Odpowiedz numerem albo „zdecyduj sam” (wtedy obowiązuje propozycja).

1. Gdzie jest baza: na Twoim własnym koncie Supabase (masz panel i hasło do bazy) czy w Lovable Cloud
   (baza zarządzana przez Lovable)? Propozycja: własne konto Supabase, zrzut według instrukcji „A”
   z załącznika na końcu raportu. Skutek: przy Lovable Cloud korzystamy z instrukcji „B”, a
   przenosiny na nową bazę są jedyną drogą wyjścia z Lovable.
2. Prośba o zrzut schematu bazy z chmury (sama struktura, bez danych i bez haseł). Propozycja:
   wykonujesz instrukcję A albo B z załącznika, wrzucasz plik do skrzynki projektu w Obsidianie i
   piszesz „materiały w skrzynce”. Skutek: bez zrzutu odtworzymy bazę z kodu „na ślepo” i nie
   sprawdzimy zgodności z chmurą.
3. Źródło prawdy dla bazy. Propozycja: zrzut staje się pierwszą migracją w repo; każda kolejna zmiana
   bazy to migracja w repo, a obecnej bazy w chmurze nie zmieniamy wcale (zostaje do przenosin).
   Skutek: lokalna baza i przyszła nowa baza w Supabase powstaną z tych samych plików.
4. Dane startowe lokalnej bazy. Propozycja: obecna oferta (9 szkoleń) i trenerzy z makiet jako dane
   startowe oraz jedno testowe konto redaktora tylko lokalnie. Skutek: lokalnie widać pełny serwis
   bez kopiowania czegokolwiek z chmury.
5. Lovable do czasu przenosin. Propozycja: synchronizacja z GitHubem zostaje włączona, nikt nie
   pracuje w edytorze Lovable, a „Publikuj” klikasz tylko Ty po odbiorze zmian; po przenosinach na
   Vercel odłączamy Lovable. Skutek: produkcja nie zmienia się bez Twojej decyzji, a historia w
   Lovable zostaje spójna.
6. Formularz kontaktu, który nic nie wysyła. Propozycja: w pierwszym etapie bez zmian; wysyłka
   zgłoszeń (e-mail, zgoda na przetwarzanie danych) to osobne zlecenie, gdy je podasz. Skutek:
   pierwszy etap nie dotyka danych osobowych.
7. Porządki w repo przed upublicznieniem. Propozycja: w adaptacji usuwamy z repo plik z kluczem
   publicznym i katalog pomiarów QA z Lovable, a repo upubliczniamy dopiero po bramce bezpieczeństwa
   i testach zasad dostępu na lokalnej bazie. Skutek: klucz publiczny zostaje w historii repo, co
   przy kluczu publicznym i bazie do wygaszenia uznajemy za akceptowalne.

## Proponowany pierwszy kamień milowy

**M1: Projekt uruchomiony lokalnie z bazą z repo.**

Cel: każdy (Ty i agenci) uruchamia serwis i panel na komputerze z lokalną bazą, a testy biegną
automatycznie w GitHubie.

Zakres:

- adaptacja repo do procesu (pliki procesu, CI: lint, typy, testy, build), bez zmian w działaniu
  aplikacji;
- pierwsza migracja bazy w repo ze zrzutu, dane startowe i lokalne konto redaktora;
- uruchomienie lokalne: serwis i panel na lokalnej bazie, instrukcja w opisie projektu;
- testy zasad dostępu na lokalnej bazie: gość nie widzi szkiców, osoba bez roli nic nie zapisuje,
  redaktor zapisuje; ewentualne poprawki zasad jako migracje;
- usunięcie z repo pliku z kluczem i katalogu pomiarów, bramka bezpieczeństwa i upublicznienie repo
  (na Twoje polecenie).

Nie obejmuje: zmian w funkcjach, wysyłki formularza, nowego projektu Supabase, przenosin na Vercel i
jakiejkolwiek publikacji w Lovable. Przenosiny (nowy projekt Supabase z migracji z repo i Vercel)
planujemy jako ostatnie zadanie całego rozwoju.

Szacunek poglądowy: 4–5 zadań, 1–2 dni kalendarzowe pracy agentów, ok. 30–45 minut Twojego czasu
(zrzut schematu, odpowiedzi, odbiór).

## Decyzja

Napisz orkiestratorowi „akceptuję analizę i kierunek” albo co zmienić. Do akceptacji nic w kodzie
aplikacji się nie zmienia, a repo zostaje w obecnej widoczności.

# Dla wykonawcy

## Stack i zależności

Menedżer pakietów: bun (`bun.lock` tekstowy, `bunfig.toml` z `minimumReleaseAge = 86400`); README
z szablonu Lovable mówi o npm, ale lockiem jest `bun.lock`. Wersja Node nieokreślona (brak
`.nvmrc`, `engines`); `@types/node` ^22. Szablon Lovable `tanstack_start_ts_current`
(`.lovable/project.json`). Skrypty: `dev` (vite dev), `build`, `build:dev`, `preview`, `lint`
(eslint), `format` (prettier), `test` (vitest run), `test:watch`, `typecheck` (tsc --noEmit).

Stack: TanStack Start (React 19, SSR, routing plikowy TanStack Router), Vite 8, Tailwind 4,
shadcn/ui (Radix), TanStack Query, react-hook-form + zod 3, Supabase JS v2, Vitest 4 + Testing
Library + jsdom. Build przez `@lovable.dev/vite-tanstack-config` (nitro, domyślny cel: Cloudflare),
wejście serwera `src/server.ts`.

| Pakiet | Wersja | Najnowsza | Stan |
|---|---|---|---|
| nitro | 3.0.260603-beta | do sprawdzenia | wersja beta przypięta dokładnie; cel build Cloudflare (Lovable) — przy przenosinach na Vercel zmiana presetu |
| @lovable.dev/vite-tanstack-config | 2.26.5 | do sprawdzenia | zależność od Lovable w buildzie; do zastąpienia własną konfiguracją Vite przy przenosinach |
| @tanstack/react-start, react-router, router-plugin | 1.168.60 / 1.170.41 / 1.168.42 | do sprawdzenia | przypięte dokładnie (szablon) |
| vite | 8.1.5 | do sprawdzenia | przypięty dokładnie; override `rolldown` 1.2.1 |
| jsdom | ^20.0.3 | do sprawdzenia | przestarzały (kilka wersji głównych wstecz) |
| zod | ^3.25.76 | do sprawdzenia | dostępna linia 4.x; aktualizacja opcjonalna |
| recharts, cmdk, embla-carousel-react, input-otp, react-day-picker, vaul, react-resizable-panels | różne | — | prawdopodobnie nieużywane (komponenty szablonu shadcn), do sprawdzenia |
| @supabase/supabase-js | ^2 | do sprawdzenia | aktualna linia |

Podatności: `bun audit` nie był uruchomiony (bun niedostępny w sandboksie serwera, rejestr pakietów
poza siecią sesji) — do sprawdzenia w CI w adaptacji.

## Architektura obecna

- Punkty wejścia: `src/router.tsx`, `src/start.ts`, `src/server.ts` (owijka SSR z własną stroną
  błędu), `src/routes/__root.tsx` (wspólny nagłówek i stopka z `src/components/brand`).
- Trasy (`src/routes`, drzewo w `src/routeTree.gen.ts`): `/`, `/szkolenia`, `/szkolenia/$id`,
  `/trenerzy`, `/trenerzy/$id`, `/fundamenty` (strona referencyjna tokenów, noindex),
  `/panel` (bramka) z `/panel/szkolenia`, `/panel/szkolenia/nowe`, `/panel/szkolenia/$id`,
  `/panel/trenerzy`, `/panel/trenerzy/nowy`, `/panel/trenerzy/$id`; `/panel/` przekierowuje na
  `/panel/szkolenia`.
- Dane publiczne: loadery tras → `src/lib/szkolenia/adapter.ts` i `src/lib/trenerzy/adapter.ts` →
  `src/lib/supabase/odczyt.ts` (`klientOdczytu`, filtr `status = 'published'` w każdym zapytaniu,
  komunikaty błędów po polsku). `mock-dane.ts` służy już tylko jako oracle testów.
- Panel: tylko po stronie klienta, `BramkaDostepu` (konfiguracja → sesja → rola przez RPC
  `moje_role()`, awaryjnie `is_staff()`); repozytoria `src/lib/panel/*-repo.ts` piszą wprost do
  tabel przez klucz publiczny i sesję użytkownika; autoryzacja wyłącznie w RLS. Rola `admin` i
  `editor` nie różnią się w UI.
- Logika biznesowa: ceny i dofinansowanie (`src/lib/szkolenia/cena.ts`), filtrowanie
  (`filtrowanie.ts`), terminy domyślne (`terminy.ts`), walidacja formularzy panelu
  (`src/lib/panel/walidacja.ts`), kolejność przypisań (`przypisania-repo.ts`).
- Reguły projektu w `AGENTS.md` (sekcja „Application rules”), do zachowania przy adaptacji.

## Mapa funkcji

| Karta | Funkcja | Punkt wejścia | Testy | Stan |
|---|---|---|---|---|
| [F-01](funkcje/F-01.md) | Strona główna | `/` | `polecane-szkolenia`, `oracle-tresci-makiety`, `nawigacja-linki` | działa |
| [F-02](funkcje/F-02.md) | Formularz kontaktu | `/#kontakt` | `formularz-kontaktu` | częściowo (bez wysyłki) |
| [F-03](funkcje/F-03.md) | Katalog szkoleń | `/szkolenia` | `katalog-widok`, `szkolenia-dane`, `trasy-walidacja`, `stany-ui`, e2e ręczny | działa |
| [F-04](funkcje/F-04.md) | Szczegół szkolenia | `/szkolenia/$id` | `szczegol-widok`, `szczegol-bez-dofinansowania`, `publiczne-adresy-i-cena` | działa |
| [F-05](funkcje/F-05.md) | Trenerzy i profil trenera | `/trenerzy`, `/trenerzy/$id` | `publiczne-trenerzy`, `kategorie-obszarow` | działa |
| [F-06](funkcje/F-06.md) | Panel: logowanie i dostęp | `/panel` | `panel-dostep` | działa (na atrapie) |
| [F-07](funkcje/F-07.md) | Panel: szkolenia | `/panel/szkolenia` | `panel-szkolenia`, `panel-szkolenia-usuwanie`, `panel-mapowanie` | działa (na atrapie) |
| [F-08](funkcje/F-08.md) | Panel: trenerzy i przypisania | `/panel/trenerzy` | `panel-trenerzy`, `przypisania-kolejnosc` | działa (na atrapie) |

Poza mapą: `/fundamenty` (strona referencyjna systemu wizualnego, noindex, wyłączona w
`robots.txt`), test `dostepnosc-kontrast`, `app-routing`, `publiczne-izolacja` (przekrojowe).

## Testy i CI

Stan wyjściowy `main` (HEAD `bc7671b`, 2026-10-28) z pomiarów zapisanych przez Lovable w
`.pomiar/` — lokalnie nie uruchomiono (bun niedostępny w sandboksie serwera, rejestr pakietów
zablokowany w sesji analizy):

| Komenda | Wynik | Źródło |
|---|---|---|
| `bun run test` (vitest run) | 22 pliki, 230 testów, wszystkie zielone | `.pomiar/isk76/test.txt` (HEAD 08676f6; po nim tylko commity pomiarów i „Changes” bez zmian testów do potwierdzenia w CI) |
| `bun run typecheck` | kod 0 | `.pomiar/isk76/typecheck.txt` |
| `bun run lint` | 0 błędów, 6 ostrzeżeń `react-refresh/only-export-components` w `src/components/ui` | `.pomiar/isk52/lint.txt` (starszy pomiar) |
| `bun run build` | brak pomiaru | do sprawdzenia w CI |
| E2E `tests/e2e/szkolenia.py` | ręczny scenariusz Playwright w Pythonie (QA), poza CI | `tests/e2e/README.md` |

CI: brak `.github/workflows`, `gh run list` na `main` pusty. Kontrakt: 22 pliki testów vitest zielone
w stanie wyjściowym zostają zielone; pierwszy bieg CI po adaptacji potwierdza listę.

## Wdrożenie

Produkcja: hosting Lovable (build nitro, cel Cloudflare), domena szkolenia.iskt.pl wg właściciela.
Publikacja ręczna przyciskiem w Lovable — tylko właściciel, tylko z jego decyzji. Brak środowiska
staging i podglądów PR. Agenci nie mają dostępu do produkcji ani do chmury Supabase. Docelowo
(ostatnie zadanie): Vercel + nowy projekt Supabase z migracji z repo.

## Integracje

- Supabase: Auth (e-mail + hasło, bez rejestracji w UI), PostgREST (tabele), RPC `moje_role`,
  `is_staff`. Brak Storage, Edge Functions, realtime.
- Lovable: telemetria błędów tylko w podglądzie edytora (`src/lib/lovable-error-reporting.ts`,
  `window.__lovableEvents`), plugin buildu.
- Brak e-maila, płatności, analityki, webhooków. Zdjęcia trenerów: zewnętrzne adresy URL wpisywane w
  panelu (obrazy z dowolnej domeny http/https).

## Zmienne środowiskowe

Tylko nazwy: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (wzór w `.env.example`).

## Lovable i Supabase

- Lovable: `.lovable/project.json` (szablon `tanstack_start_ts_current`), `.lovable/plan/` (plan
  katalogu z 2026-10-26), blok `LOVABLE` w `AGENTS.md`, odnośnik w `README.md`. Synchronizacja z
  GitHubem aktywna: 209 commitów z Lovable, ostatni 2026-10-28T20:27:51Z. Zasada: synchronizacja
  zostaje, bez publikacji w Lovable bez decyzji właściciela, bez przepisywania historii `main`
  (force push, rebase) — Lovable to odczuje.
- Klient Supabase: `src/lib/supabase/klient.ts`, URL i klucz z env (`import.meta.env`), leniwy
  singleton, sesja w `localStorage` tylko w przeglądarce. Klucz: publishable (`sb_publishable`, rola
  anon) — publiczny z założenia. **Alarm:** `.env` śledzony w repo mimo wpisu w `.gitignore`
  (`.env`, linia 2: klucz publishable). Bez `service_role` w repo. Zalecenie: `git rm --cached .env`
  w adaptacji; unieważnienie klucza nie jest konieczne (anon), stara baza do wygaszenia.
- Katalog `supabase/`: **nie istnieje** — brak `config.toml`, migracji (0), edge functions, seed. W
  historii repo nigdy nie było SQL (sprawdzone `git log -S "create table"`). Schemat żyje tylko w
  chmurze.
- Schemat odtworzony z kodu (do weryfikacji na zrzucie):
  - `public.szkolenia`: `id` (text, slug, PK), `sort_order` int (prawdopodobnie unikalny — komunikat
    dla `23505`), `cat`, `icon`, `title`, `level`, `hours`, `format`, `price` numeric, `badge` null,
    `fundable` bool, `opis`, `learn` text[], `program` jsonb (`[{n,t}]`), `for_whom`, `terms` text[]
    null (null = terminy domyślne, `[]` = brak terminów), `status` (`draft`|`published`),
    `published_at`, `created_at`, `updated_at`.
  - `public.trenerzy`: `id` (text, PK), `sort_order`, `name`, `initials`, `role`, `areas` text[],
    `tagline`, `bio`, `experience` jsonb, `education` jsonb, `skills` text[], `photo_url` null,
    `status`, `published_at`, `created_at`, `updated_at`.
  - `public.szkolenie_trener`: `szkolenie_id`, `trener_id` (PK złożony?), `sort_order_trener`,
    `sort_order_szkolenie` (DEFAULT 0); usunięcie szkolenia usuwa przypisania (FK `on delete
    cascade`?) — test „potwierdzenie usuwa tylko szkolenie”.
  - Funkcje: `moje_role()` (zwraca role `admin`/`editor`), `is_staff()` (bool); tabela ról
    (nazwa nieznana, np. `user_roles`) — w kodzie nieużywana wprost.
- RLS (`sh-kat-baza`) — przegląd niemożliwy bez migracji; oczekiwane polityki i zgłoszenia:

| Tabela | Oczekiwana polityka | Zgłoszenie | Waga |
|---|---|---|---|
| `szkolenia` | anon/auth `select` tylko `status = 'published'`; staff (`is_staff()`) pełny CRUD | nieweryfikowalne; aplikacja filtruje szkice sama (test `publiczne-izolacja`), ale klucz publiczny pozwala pytać PostgREST bezpośrednio — szkice muszą być odcięte w RLS | 🔴 do weryfikacji |
| `trenerzy` | jak wyżej | jak wyżej | 🔴 do weryfikacji |
| `szkolenie_trener` | anon `select` tylko wierszy, gdzie obie strony opublikowane; staff CRUD | odczyt publiczny bez warunku ujawnia identyfikatory (slugi) szkiców przez relację | 🟡 do weryfikacji |
| tabela ról | `select` tylko własnych wierszy, zapis tylko admin/serwis | uprawnienia nie mogą wynikać z `user_metadata` (kod ich nie używa — dobrze) | 🔴 do weryfikacji |
| `moje_role`, `is_staff` | `security definer` z `set search_path`, `execute` dla `authenticated` | do weryfikacji na zrzucie | 🟡 |
| Auth | rejestracja publiczna wyłączona (panel nie ma rejestracji, ale API Supabase może ją mieć włączoną) | do weryfikacji w konfiguracji Auth | 🟡 |

- Schemat w chmurze: **pytanie o zrzut** (pytanie 2 części „Dla właściciela”, instrukcja
  `supabase db dump --linked --schema-only`). Plan po zrzucie: `supabase/migrations/<ts>_baza.sql` ze
  zrzutu (bez danych), porównanie z kodem (kolumny wyżej), przy rozjeździe migracja wyrównująca w
  repo (nigdy w chmurze); `supabase/seed.sql` z oracle `mock-dane.ts` i
  `src/test/dane-z-makiety-trenerzy.ts`; lokalny użytkownik redaktora z rolą w seedzie. Zasada:
  źródłem prawdy są migracje w repo; obecnej bazy w chmurze nie zmieniamy, a nowa produkcja powstanie
  z migracji. `supabase/config.toml` z blokiem portów 55421–55429 (`docs/konfiguracja.md`) w
  adaptacji albo zadaniu bazy.

## Dług techniczny

| Obszar | Problem | Waga | Propozycja |
|---|---|---|---|
| Baza | Brak migracji, seedu i `config.toml` w repo | 🔴 | Migracja bazowa ze zrzutu, seed, lokalna baza (M1) |
| Bezpieczeństwo | RLS nieweryfikowalne, testy uprawnień tylko na atrapie | 🔴 | Testy RLS na lokalnej bazie (pgTAP albo testy integracyjne supabase-js) |
| Repo | `.env` śledzony mimo `.gitignore` | 🟡 | `git rm --cached .env` w adaptacji |
| CI | Brak workflow | 🟡 | CI z adaptacji: lint, typecheck, test, build (bun) |
| Repo | Katalog `.pomiar/` z wynikami pomiarów QA Lovable (37 plików) | ⚪ | Usunąć albo przenieść podsumowanie do `docs/` |
| Narzędzia | bun nieuruchamialny w sandboksie serwera (npx bun kończy się kodem 1) | 🟡 | Zainstalować bun na serwerze albo przejść na pnpm (decyzja w adaptacji, ADR przy zmianie) |
| E2E | Scenariusz Playwright w Pythonie poza CI | ⚪ | Przepisać na Playwright TS w CI (zgodnie z procesem) |
| Build | Zależność od `@lovable.dev/vite-tanstack-config` i nitro beta z celem Cloudflare | 🟡 | Przy przenosinach na Vercel: własna konfiguracja Vite i preset Vercel |
| Zależności | Prawdopodobnie nieużywane komponenty i paczki szablonu shadcn | ⚪ | Przegląd i usunięcie w drobnym zleceniu |
| Treści | Formularz kontaktu bez wysyłki, przyciski zapisu prowadzą do niego | 🟡 | Osobne zlecenie (e-mail, RODO) |
| Dokumentacja | README z szablonu Lovable | ⚪ | README z instrukcją lokalną w M1 |
| Lint | 6 ostrzeżeń `react-refresh` w `src/components/ui` | ⚪ | Zostawić (kod szablonu) |

## Nie przeanalizowano

- Uruchomienie testów, lintu, typów i buildu lokalnie: bun niedostępny w sandboksie, rejestr pakietów
  zablokowany w sesji analizy; stan wyjściowy z `.pomiar/`, potwierdzenie w pierwszym biegu CI.
- `bun audit` i aktualność wersji pakietów: jak wyżej, do sprawdzenia w CI.
- Zgodność schematu w chmurze z kodem i RLS: czeka na zrzut od właściciela.
- Konfiguracja Auth w Supabase (rejestracja, potwierdzanie e-maili) i domeny w Lovable: brak dostępu
  agentów do chmury.

# Załącznik: zrzut schematu bazy (dla właściciela)

Zrzut zawiera tylko strukturę bazy (tabele, zasady dostępu, funkcje), bez danych i bez haseł. Nie
wysyłaj nam hasła do bazy ani kluczy; plik wynikowy wrzuć do skrzynki projektu (folder
„SH/Skrzynka/szkolenia-iskt” w Obsidianie) i napisz orkiestratorowi „materiały w skrzynce”.

A. Własne konto Supabase, w Terminalu na swoim komputerze, w dowolnym pustym folderze poza repo:

```sh
supabase login
supabase link --project-ref IDENTYFIKATOR_PROJEKTU
supabase db dump --linked --schema-only -f schemat.sql
supabase db dump --linked --schema-only --schema auth,storage -f schemat-auth-storage.sql
```

Identyfikator projektu jest w panelu Supabase (Project Settings → General). Przy `link` narzędzie
zapyta o hasło do bazy; wpisujesz je tylko w Terminalu. Drugi plik jest opcjonalny (zmiany w
schematach logowania i plików, np. wyzwalacze na nowych użytkownikach). Dołącz też zrzut ekranu
ustawień Authentication → Sign In / Providers (czy rejestracja nowych użytkowników jest włączona).

B. Lovable Cloud (bez dostępu do panelu Supabase): w Lovable otwórz Cloud → Database i sprawdź, czy
jest eksport schematu albo edytor SQL. Jeśli jest edytor SQL, napisz orkiestratorowi — przygotujemy
zapytanie tylko do odczytu, którego wynik zapiszesz do pliku. Nie proś czatu Lovable o wygenerowanie
pliku w repo: to zmieniłoby kod i historię.
