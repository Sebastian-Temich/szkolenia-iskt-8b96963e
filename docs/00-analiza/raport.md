# Analiza projektu: szkolenia-iskt

Repo: Sebastian-Temich/szkolenia-iskt-8b96963e · Analiza: 2026-11-12T13:31Z – 2026-11-12T14:25Z (UTC) · Limit: 120 min

Iteracja 2 (2026-11-12T14:00Z): właściciel udostępnił bazę w chmurze do odczytu przez połączenie
Supabase (MCP). Schemat, zasady dostępu i funkcje przejrzane wyłącznie zapytaniami tylko do odczytu;
w chmurze niczego nie zmieniono.

# Dla właściciela

## Stan w jednym akapicie

Serwis szkolenia.iskt.pl to publiczna strona oferty szkoleń ISKT (strona główna, katalog szkoleń z
filtrami, szczegół szkolenia z ceną i terminami, lista trenerów i ich profile) oraz panel
redakcyjny, w którym zalogowany redaktor dodaje, edytuje, publikuje i usuwa szkolenia oraz trenerów
i przypisuje trenerów do szkoleń. Aplikacja powstała w Lovable w dniach 16–28 października 2026 i
od tego czasu nikt jej nie zmieniał. Kod jest uporządkowany i dobrze pokryty testami (sprawdziliśmy sami:
230 testów zielonych, typy bez błędów, build działa), ale w repozytorium nie ma żadnej definicji bazy danych: tabele,
zasady dostępu i funkcje ról istnieją tylko w chmurze. Przejrzeliśmy bazę w chmurze (tylko odczyt):
jej budowa zgadza się z kodem, a zasady dostępu są poprawne — gość widzi tylko opublikowane treści,
a zapisywać może wyłącznie konto z rolą redaktora. Baza jest jednak pusta: nie ma w niej ani jednego
szkolenia, trenera ani redaktora z rolą. Pierwszym krokiem jest przeniesienie tej budowy do repo jako
pierwszej migracji, z danymi startowymi z makiet, i uruchomienie lokalne.

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
- Baza w chmurze: cztery tabele (szkolenia, trenerzy, przypisania, role), wszystkie z zasadami
  dostępu; ukrywanie szkiców i blokada zapisu bez roli działają po stronie bazy, nie tylko w
  przeglądarce. Dowód: przegląd zasad dostępu w chmurze i porady bezpieczeństwa Supabase.

## Czego brakuje

- Definicji bazy w repozytorium (tabele, zasady dostępu, funkcje ról, dane startowe): bez tego nie
  ma lokalnej bazy ani przenosin na nowy projekt Supabase.
- Automatycznych testów w GitHubie (brak CI): testy uruchamiał tylko Lovable i ręcznie QA.
- Testów na prawdziwej bazie: zasady dostępu są poprawne w przeglądzie, ale testy aplikacji
  sprawdzają je tylko na atrapie.
- Treści i redaktorów w bazie w chmurze: wszystkie tabele są puste, a jedyne konto użytkownika nie ma
  roli redaktora.
- Wysyłki formularza kontaktu i zapisów na szkolenie (przyciski prowadzą do formularza, który nic nie
  wysyła).
- Wgrywania zdjęć trenerów (jest tylko pole na adres zdjęcia z internetu).
- Instrukcji uruchomienia lokalnego i opisu projektu (opis w repo to szablon Lovable).

## Ryzyka

| Ryzyko | Waga | Co proponujemy |
|---|---|---|
| Budowa bazy żyje tylko w chmurze, poza repo | 🔴 | Pierwsza migracja w repo odtworzona z bazy w chmurze (odczyt); od tej pory źródłem prawdy są migracje w repo |
| Baza w chmurze jest pusta: jeśli produkcja na Lovable z niej korzysta, katalog i lista trenerów są puste, a panel nikogo nie wpuści | 🟡 | Sprawdzić, co dziś pokazuje produkcja (pytanie 1); obecnej bazy nie zmieniamy, treści trafią do nowej bazy przy przenosinach |
| Zasady dostępu są poprawne, ale nic ich nie testuje | 🟡 | Testy zasad dostępu na lokalnej bazie w M1, przed upublicznieniem repo |
| W bazie w chmurze wyłączona jest ochrona przed hasłami, które wyciekły w innych serwisach | ⚪ | Włączamy w nowym projekcie Supabase przy przenosinach (obecnej bazy nie zmieniamy) |
| Plik z adresem bazy i kluczem publicznym jest w repozytorium | 🟡 | To klucz publiczny (nie administratora), więc nie trzeba go unieważniać; usuwamy plik z repo w adaptacji, a stara baza i tak zostanie zastąpiona nową |
| Każda zmiana na głównej gałęzi trafia do edytora Lovable, a przycisk „Publikuj” w Lovable wypuściłby ją na produkcję | 🟡 | Nie pracujemy w Lovable i nie publikujemy bez Twojej decyzji; główna gałąź zawsze stabilna |
| Brak CI: zmiana może coś zepsuć bez sygnału | 🟡 | CI (lint, typy, testy, build) w adaptacji |
| Formularz kontaktu wygląda na działający, a nic nie wysyła | 🟡 | Na produkcji klienci mogą myśleć, że wysłali zgłoszenie; osobne zlecenie na wysyłkę albo informacja na stronie |
| Szkolenia bez własnych terminów pokazują terminy domyślne z września i października 2026, czyli już minione | 🟡 | Na produkcji sprawdzić, które szkolenia nie mają własnych terminów; zmiana terminów domyślnych jako pierwsze drobne zlecenie po M1 |
| Polecane szkolenia na stronie głównej są wybrane na stałe w kodzie (cztery konkretne) | ⚪ | Gdy któreś zostanie wycofane, sekcja pokaże mniej pozycji; wybór polecanych w panelu jako przyszłe zlecenie |
| Dwie paczki mają znane podatności o wysokiej wadze: serwer deweloperski (dotyczy tylko pracy na komputerze, nie produkcji) i biblioteka walidacji formularzy (dotyczy tylko bardzo dużych danych w panelu) | 🟡 | Aktualizacja jako drobne zlecenie po M1; biblioteka walidacji wymaga zmiany wersji głównej |
| Około 40 nieużywanych elementów i kilkanaście zbędnych paczek z szablonu Lovable | ⚪ | Usunięcie w drobnym zleceniu: mniej aktualizacji i mniej powierzchni ataku |
| Część pakietów w wersjach beta lub mocno nieaktualnych | ⚪ | Przegląd w CI, aktualizacje jako drobne zlecenia |

## Pytania do Ciebie

Odpowiedz numerem albo „zdecyduj sam” (wtedy obowiązuje propozycja).

1. Co dziś pokazuje produkcja: pełną ofertę czy pustą listę? Baza w chmurze jest pusta, więc pełna
   oferta oznaczałaby, że opublikowana w Lovable wersja jest starsza i korzysta z danych wpisanych w
   kod. Propozycja: sprawdzasz katalog na produkcji i piszesz, co widać. Skutek: przy starszej wersji
   na produkcji przed przenosinami trzeba będzie wpisać treści do nowej bazy; przy pustej liście
   produkcja jest dziś pusta i warto ocenić, czy to pilne.
2. Narzędzie do instalowania paczek. Projekt z Lovable używa narzędzia, które nie uruchamia się na
   naszym serwerze, a zasady pracy agentów dopuszczają tylko jedno inne (to, którego używamy we
   wszystkich projektach). Propozycja: w adaptacji przechodzimy na narzędzie z naszych zasad, z
   zapisaną decyzją techniczną. Skutek: agenci uruchomią testy na serwerze; Lovable po synchronizacji
   może budować inaczej niż dziś, co ma znaczenie tylko wtedy, gdy przed przenosinami na Vercel
   zechcesz jeszcze publikować w Lovable.
3. Źródło prawdy dla bazy. Propozycja: od pierwszej migracji każda zmiana bazy to migracja w repo, a
   obecnej bazy w chmurze nie zmieniamy wcale (zostaje do przenosin). Skutek: lokalna baza i przyszła
   nowa baza w Supabase powstaną z tych samych plików.
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

- adaptacja repo do procesu (pliki procesu, CI: lint, typy, testy, build, zmiana narzędzia do
  paczek według pytania 2), bez zmian w działaniu aplikacji;
- pierwsza migracja bazy w repo odtworzona z chmury, dane startowe i lokalne konto redaktora;
- uruchomienie lokalne: serwis i panel na lokalnej bazie, instrukcja w opisie projektu;
- testy zasad dostępu na lokalnej bazie: gość nie widzi szkiców, osoba bez roli nic nie zapisuje,
  redaktor zapisuje; ewentualne poprawki zasad jako migracje;
- usunięcie z repo pliku z kluczem i katalogu pomiarów, bramka bezpieczeństwa i upublicznienie repo
  (na Twoje polecenie).

Nie obejmuje: zmian w funkcjach, wysyłki formularza, nowego projektu Supabase, przenosin na Vercel i
jakiejkolwiek publikacji w Lovable. Przenosiny (nowy projekt Supabase z migracji z repo i Vercel)
planujemy jako ostatnie zadanie całego rozwoju.

Szacunek poglądowy: 4–5 zadań, 1–2 dni kalendarzowe pracy agentów, ok. 20–30 minut Twojego czasu
(odpowiedzi, sprawdzenie produkcji, odbiór).

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
| recharts (2.x wycofana), cmdk, embla-carousel-react, input-otp, react-day-picker, vaul, react-resizable-panels, sonner, date-fns | różne | — | nieużywane przez aplikację: importują je tylko nieużywane komponenty `src/components/ui` |
| @supabase/supabase-js | ^2 | do sprawdzenia | aktualna linia |

Użycie `src/components/ui`: aplikacja importuje tylko `button`, `skeleton`, `badge`, `alert-dialog`,
`table` (zależności: `@radix-ui/react-slot`, `@radix-ui/react-alert-dialog`,
`class-variance-authority`, `lucide-react`). Pozostałe ~43 komponenty szablonu shadcn i ich paczki
(większość `@radix-ui/*`, `recharts`, `cmdk`, `embla-carousel-react`, `input-otp`,
`react-day-picker`, `vaul`, `react-resizable-panels`, `sonner`, `date-fns`) są martwe.

Podatności (`npm audit` 2026-11-12 na kopii z npm; wersje rozwiązane z zakresów `package.json`, nie z
`bun.lock`):

| Pakiet | Waga | Zakres | Ocena |
|---|---|---|---|
| vite 8.1.5 (przypięty) | high | GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22, launch-editor ×3 | tylko serwer deweloperski; poprawka vite ≥ 8.3.8 (sprawdzić zgodność z `@lovable.dev/vite-tanstack-config` albo przy przenosinach) |
| zod 3.25 | high | GHSA-mrhx-c7xc-m3w5 (wyczerpanie pamięci przy dużych kolekcjach) | walidacja formularzy panelu w przeglądarce; poprawka tylko w 4.6.6+ (zmiana wersji głównej) |
| minimatch przez typescript-eslint | moderate ×7 | GHSA-g3hv-75wg-m249 | tylko lint (dev) |

Ostrzeżenia `deprecated`: recharts 2.x, eslint 9.39, tsconfck, zależności jsdom 20
(whatwg-encoding, abab, domexception).

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

Stan wyjściowy `main` (HEAD `bc7671b`, 2026-10-28), zmierzony 2026-11-12 na kopii `git archive
origin/main` (bez `.env`) w scratchpadzie serwera: `npm install --ignore-scripts` (Node z fnm,
wersje z zakresów `package.json`, bez `bun.lock`), potem skrypty `package.json`. Zgodne z pomiarami
Lovable w `.pomiar/isk76` i `.pomiar/isk52`:

| Komenda | Wynik |
|---|---|
| `test` (vitest 4.1.12) | 22 pliki, 230 testów, wszystkie zielone (57 s) |
| `typecheck` (tsc --noEmit) | kod 0 |
| `lint` (eslint) | 0 błędów, 6 ostrzeżeń `react-refresh/only-export-components` w `src/components/ui` (badge, button, form, navigation-menu, sidebar, toggle) |
| `build` (vite 8.1.5 + nitro) | zielony; preset nitro `cloudflare-module`, generuje `.output/server/wrangler.json`; ostrzeżenie: `vite-tsconfig-paths` zbędny przy natywnym `resolve.tsconfigPaths` |
| E2E `tests/e2e/szkolenia.py` | nieuruchomiony: ręczny scenariusz Playwright w Pythonie (QA), poza CI |

Bun na serwerze: `@oven/bun-darwin-x64` i `-baseline` 1.3 kończą się kodem 132 (SIGILL) już na
`--version` — bun nie działa na tym Macu (w sandboksie sesji), a kontrakt stacku szablonu
(`AGENTS.md` sh-template-projekt) dopuszcza wyłącznie pnpm. Wniosek: przejście na pnpm w adaptacji
(pytanie 2), `pnpm import` nie czyta `bun.lock`, więc lock powstaje z zakresów jak w tym pomiarze.

CI: brak `.github/workflows`, `gh run list` na `main` pusty. Kontrakt: 22 pliki testów vitest zielone
w stanie wyjściowym zostają zielone; pierwszy bieg CI po adaptacji potwierdza listę.

## Wdrożenie

Produkcja: hosting Lovable (build nitro, cel Cloudflare), domena szkolenia.iskt.pl wg właściciela.
Publikacja ręczna przyciskiem w Lovable — tylko właściciel, tylko z jego decyzji. Brak środowiska
staging i podglądów PR. Agenci nie mają dostępu do produkcji; do bazy w chmurze (projekt Supabase
`szkolenia-isk`, region eu-central-1, Postgres 17) właściciel udostępnił odczyt przez MCP Supabase
2026-11-12 — wyłącznie zapytania tylko do odczytu, bez `apply_migration` i bez zapisów. Docelowo
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
  historii repo nigdy nie było SQL (sprawdzone `git log -S "create table"`). W chmurze tabela
  `supabase_migrations` też jest pusta (`list_migrations` = 0): schemat powstał poza migracjami
  (SQL Editor / Lovable).
- Schemat w chmurze (odczyt MCP 2026-11-12, `list_tables`, `pg_constraint`, `pg_indexes`,
  `pg_policies`, `pg_proc`, `information_schema`):
  - `public.szkolenia` (0 wierszy): `id` text PK z CHECK `^[a-z0-9][a-z0-9-]*$`; `sort_order` int
    UNIQUE (nie DEFERRABLE) `>= 0`; `cat` CHECK in (`AI`,`ESG`,`Angielski`,`Software`,`B+R`); `icon`
    CHECK in (`cpu`,`leaf`,`languages`,`code-xml`,`flask-conical`); `title`, `level`, `hours`,
    `format`, `opis`, `for_whom` text niepuste (CHECK `length(btrim()) > 0`); `price` int `>= 0`;
    `badge` text null; `fundable` bool default false; `learn` text[] 1–12; `program` jsonb array
    1–24; `terms` text[] null; `status` text default `draft` CHECK in (`draft`,`published`);
    `published_at` null; `created_at`, `updated_at` default now(). Indeksy: `cat`, `(status,
    sort_order)`.
  - `public.trenerzy` (0 wierszy): `id` jak wyżej; `sort_order` UNIQUE; `name`, `initials`, `role`,
    `tagline`, `bio` niepuste; `areas` text[] ⊆ kategorie, 1–5; `experience`, `education` jsonb array
    default `[]`; `skills` text[] default `{}`; `photo_url` null; `status`, `published_at`,
    `created_at`, `updated_at` jak wyżej. Indeks `(status, sort_order)`.
  - `public.szkolenie_trener` (0 wierszy): PK `(szkolenie_id, trener_id)`, FK do obu tabel `ON DELETE
    CASCADE`; `sort_order_trener`, `sort_order_szkolenie` int default 0 `>= 0`; `created_at`.
    Indeksy po `szkolenie_id` i `trener_id`.
  - `public.user_roles` (0 wierszy): PK `(user_id, role)`, `user_id` FK → `auth.users ON DELETE
    CASCADE`, `role` enum `public.app_role` (`admin`,`editor`), `created_at`. RLS włączone, **bez
    polityk** i bez grantów dla `anon`/`authenticated` — dostęp tylko przez funkcje `security
    definer` (zamierzone, komentarz tabeli: zapis wyłącznie `service_role`/SQL).
  - Funkcje (`search_path = ''`, `security definer` poza wyzwalaczem): `is_staff()`, `is_admin()`,
    `moje_role()` (execute: anon, authenticated), `has_role(uuid, app_role)` (execute tylko
    `service_role`), `dotknij_updated_at()` (wyzwalacz BEFORE INSERT/UPDATE na `szkolenia` i
    `trenerzy`: `updated_at = now()`, `published_at` = now() przy pierwszej publikacji, null przy
    powrocie do `draft`), `rls_auto_enable()` (domyślna funkcja Supabase dla event triggera
    `ensure_rls`).
  - Rozszerzenia: `pg_stat_statements`, `pgcrypto`, `uuid-ossp`, `supabase_vault`, `plpgsql`
    (standard Supabase). Storage: 0 bucketów. Edge Functions: 0. Auth: 1 użytkownik, 0 przypisanych
    ról.
- Porównanie z kodem: **zgodne**. Kolumny, typy i nazwy odpowiadają `SzkolenieWiersz`,
  `TrenerWiersz` i `przypisania-repo.ts`; walidacja panelu jest równa albo ostrzejsza od CHECK
  (`learn` dokładnie 4 w panelu vs 1–12 w bazie; `price` int ≥ 0; `program` 1–24; `areas` 1–5;
  wzorzec `id` identyczny). Kod jawnie ustawia `published_at` przy publikacji — wyzwalacz go nie
  nadpisuje (zmienia tylko null), a przy wycofaniu czyści — spójne. Brak rozjazdu: migracja
  wyrównująca niepotrzebna.
- RLS (`sh-kat-baza`), polityki z `pg_policies`; granty: `anon` SELECT, `authenticated`
  SELECT/INSERT/UPDATE/DELETE na trzech tabelach treści:

| Tabela | Polityki | Ocena | Waga |
|---|---|---|---|
| `szkolenia` | `select_publiczne` (anon, authenticated): `status = 'published'`; `select/insert/update/delete_staff` (authenticated): `is_staff()` (update z `with check`) | poprawne: szkice odcięte w bazie, zapis tylko staff | ✅ |
| `trenerzy` | jak `szkolenia` | poprawne | ✅ |
| `szkolenie_trener` | `szt_select_publiczne`: oba końce `published` (EXISTS); `szt_*_staff`: `is_staff()` | poprawne: relacja nie ujawnia slugów szkiców | ✅ |
| `user_roles` | brak polityk, brak grantów dla klienta | poprawne (deny-all; role czytane przez `moje_role()`); brak drogi samonadania | ✅ (advisor INFO `rls_enabled_no_policy` — zamierzone) |
| `is_staff`, `is_admin`, `moje_role` | `security definer`, `search_path=''`, wołalne przez anon | zwracają wyłącznie dane bieżącego `auth.uid()` (anon: false/pusto) — bez wycieku; advisor WARN 0028/0029 | ⚪ można odebrać `execute` anon w nowej migracji |
| `rls_auto_enable` | event trigger, wołalny przez RPC | wywołanie poza event triggerem kończy się błędem; standard Supabase | ⚪ |
| `has_role` | tylko `service_role` | poprawne | ✅ |
| Auth | advisor: ochrona przed wyciekniętymi hasłami wyłączona; ustawień rejestracji nie da się odczytać przez SQL | 🟡 do ustawienia w nowym projekcie (`config.toml`: `enable_signup = false` lokalnie, ochrona haseł w nowej chmurze) | 🟡 |
| Wydajność | advisor: wiele permisywnych polityk SELECT dla `authenticated`; nieużywane indeksy (pusta baza) | bez znaczenia przy kilkunastu wierszach | ⚪ |

- Plan migracji (M1): `supabase/migrations/<ts>_baza.sql` odtworzona z katalogu chmury (typ enum,
  tabele z CHECK i komentarzami, FK, indeksy, funkcje, wyzwalacze, RLS, polityki, granty) — przez
  MCP tylko do odczytu albo `supabase db dump --schema-only`, jeśli właściciel woli; weryfikacja:
  te same zapytania katalogowe na lokalnej bazie dają identyczny wynik co w chmurze.
  `supabase/seed.sql` z oracle `mock-dane.ts` i `src/test/dane-z-makiety-trenerzy.ts` oraz lokalny
  redaktor z rolą `editor`. Zasada: źródłem prawdy są migracje w repo; obecnej bazy w chmurze nie
  zmieniamy (ani treści, ani ról), a nowa produkcja powstanie z migracji. `supabase/config.toml` z
  blokiem portów 55421–55429 (`docs/konfiguracja.md`) w adaptacji albo zadaniu bazy.

## Dług techniczny

| Obszar | Problem | Waga | Propozycja |
|---|---|---|---|
| Baza | Brak migracji, seedu i `config.toml` w repo; w chmurze też brak historii migracji | 🔴 | Migracja bazowa odtworzona z chmury, seed, lokalna baza (M1) |
| Bezpieczeństwo | RLS poprawne w przeglądzie, ale testy uprawnień tylko na atrapie | 🟡 | Testy RLS na lokalnej bazie (pgTAP albo testy integracyjne supabase-js) |
| Dane | Baza w chmurze pusta (0 treści, 0 ról) | 🟡 | Ustalić stan produkcji (pytanie 1); treści do nowej bazy przy przenosinach |
| Baza | `sort_order` UNIQUE bez DEFERRABLE w `szkolenia` i `trenerzy`: zamiana kolejności dwóch wpisów w panelu wymaga pozycji pośredniej | ⚪ | Zostawić (panel pokazuje komunikat duplikatu) albo `DEFERRABLE` w przyszłej migracji |
| Repo | `.env` śledzony mimo `.gitignore` | 🟡 | `git rm --cached .env` w adaptacji |
| CI | Brak workflow | 🟡 | CI z adaptacji: lint, typecheck, test, build (bun) |
| Repo | Katalog `.pomiar/` z wynikami pomiarów QA Lovable (37 plików) | ⚪ | Usunąć albo przenieść podsumowanie do `docs/` |
| Narzędzia | bun nie działa na serwerze (SIGILL, także wariant baseline), kontrakt stacku wymaga pnpm | 🟡 | Przejście na pnpm w adaptacji z ADR; `minimumReleaseAge` z `bunfig.toml` przenieść do `pnpm-workspace.yaml`; usunąć `bun.lock`, `bunfig.toml` |
| Bezpieczeństwo | vite 8.1.5 i zod 3 z podatnościami high (dev server; walidacja w przeglądarce) | 🟡 | Aktualizacja w drobnym zleceniu po M1 |
| Zależności | ~43 nieużywane komponenty `src/components/ui` i kilkanaście paczek | ⚪ | Usunięcie w drobnym zleceniu |
| E2E | Scenariusz Playwright w Pythonie poza CI | ⚪ | Przepisać na Playwright TS w CI (zgodnie z procesem) |
| Build | Zależność od `@lovable.dev/vite-tanstack-config` i nitro beta z celem Cloudflare | 🟡 | Przy przenosinach na Vercel: własna konfiguracja Vite i preset Vercel |
| Treści | Formularz kontaktu bez wysyłki, przyciski zapisu prowadzą do niego | 🟡 | Osobne zlecenie (e-mail, RODO) |
| Dokumentacja | README z szablonu Lovable | ⚪ | README z instrukcją lokalną w M1 |
| Lint | 6 ostrzeżeń `react-refresh` w `src/components/ui` | ⚪ | Zostawić (kod szablonu) |

## Nie przeanalizowano

- Wynik testów z dokładnymi wersjami z `bun.lock` (pomiar na wersjach rozwiązanych przez npm);
  potwierdzenie w pierwszym biegu CI po adaptacji.
- Najnowsze wersje pakietów (kolumna „Najnowsza”): `npm outdated` pominięty, aktualizacje i tak idą
  osobnym zleceniem.
- Uruchomienie serwisu w przeglądarce na lokalnej bazie: lokalnej bazy jeszcze nie ma (M1).
- Ustawienia Auth niedostępne przez SQL (rejestracja publiczna, potwierdzanie e-maili, dostawcy) i
  domena w Lovable: do sprawdzenia przy przenosinach albo w panelu przez właściciela.
- Którą bazę wskazuje opublikowana wersja w Lovable (repo `.env` → ten projekt wg właściciela; wersja
  opublikowana może być starsza): pytanie 1 części „Dla właściciela”.
