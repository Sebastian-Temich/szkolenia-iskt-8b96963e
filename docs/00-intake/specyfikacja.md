# Specyfikacja: szkolenia-iskt, zlecenie M1 „Projekt uruchomiony lokalnie z bazą z repo”

Zlecenie: `docs/00-intake/zrodlo.md`. Zlecono (UTC): 2026-11-12T22:38Z.

Projekt przejęty: stan wyjściowy, karty funkcji w stanie obecnym (F-01…F-08) i decyzje z checkpointu
analizy są w `docs/00-analiza/raport.md` i `docs/decyzje.md` (wiersze z 2026-11-12). Ta specyfikacja
ich nie powtarza.

## Cel i kontekst

Serwis szkolenia.iskt.pl (publiczna oferta szkoleń i panel redakcyjny) powstał w Lovable i działa
na bazie Supabase w chmurze, której budowy nie ma w repo. Bez tego nikt — ani agenci, ani właściciel —
nie uruchomi serwisu na komputerze, nie sprawdzi zasad dostępu do danych testem i nie przeniesie go
później na nową bazę produkcyjną.

Rezultat M1: serwis i panel działają lokalnie na bazie zbudowanej wyłącznie z plików w repo, z danymi
startowymi z makiet; zasady dostępu do bazy są sprawdzane testami; każdy PR przechodzi automatyczne
sprawdzenia w GitHubie. Zachowanie serwisu dla gości i redaktorów się nie zmienia.

Kolejność dalszych prac (decyzja właściciela, `zrodlo.md`): najpierw M1 i zadania właściciela na bazie
lokalnej, na końcu migracja i przepięcie na bazę produkcyjną w chmurze razem z przeniesieniem z
Lovable na Vercel.

## Użytkownicy

| Grupa | Potrzeba | Uprawnienia |
|---|---|---|
| Właściciel | Uruchomić serwis u siebie, odebrać zmiany bez publikacji | Wszystko lokalnie; publikacja tylko jego decyzją |
| Agenci (worker, review, QA) | Działająca baza do testów i sprawdzania zmian | Lokalna baza przez `shctl db`; bez dostępu do chmury |
| Gość serwisu (lokalnie) | Oferta i trenerzy jak na produkcji | Odczyt opublikowanych treści |
| Redaktor (lokalnie, konto testowe) | Panel redakcyjny | Zapis treści przez rolę `editor` |

## Zakres

W zakresie:

- przejście z bun na pnpm (instalacja, lock, skrypty, CI);
- pierwsza migracja w `supabase/` odtwarzająca 1:1 budowę bazy w chmurze (opis w raporcie analizy,
  „Lovable i Supabase”) i `supabase/config.toml` z blokiem portów projektu;
- dane startowe: 9 szkoleń z makiety, 6 trenerów z makiety, przypisania, konto testowe redaktora i
  konto bez roli;
- uruchomienie lokalne serwisu i panelu na tej bazie z instrukcją w `README.md`;
- testy zasad dostępu na lokalnej bazie (pgTAP);
- CI: lint, typy, testy, build oraz job bazy (migracje na czystej bazie, pgTAP).

Poza zakresem (odłożone, osobne zlecenia):

- zmiany funkcji serwisu i panelu, wysyłka formularza kontaktu, terminy domyślne;
- poprawki z kontroli bezpieczeństwa Supabase (np. odebranie gościom wywołania funkcji ról,
  ochrona przed wyciekniętymi hasłami) — budowa bazy w M1 jest kopią chmury 1:1;
- aktualizacje paczek z podatnościami i usuwanie nieużywanych elementów szablonu;
- migracja i przepięcie na bazę produkcyjną w chmurze, przeniesienie na Vercel, odłączenie Lovable;
- jakiekolwiek zmiany w obecnej bazie w chmurze i publikacja w Lovable.

## Wymagania

### W-01: Jedno narzędzie do paczek: pnpm (musi) (bez karty: narzędzia projektu)

Jako agent chcę instalować i uruchamiać projekt przez pnpm, aby testy działały na serwerze zgodnie z
kontraktem stacku.

- W-01/K1: Given czyste repo, when `pnpm install --frozen-lockfile`, then instalacja kończy się
  sukcesem, a w repo nie ma `bun.lock` ani `bunfig.toml`.
- W-01/K2: Given zainstalowane zależności, when `pnpm test`, `pnpm typecheck`, `pnpm lint`,
  `pnpm build`, then wyniki są równe stanowi wyjściowemu z raportu analizy (230 testów zielonych,
  0 błędów typów, 0 błędów lintu, build zielony).
- W-01/K3: Given `pnpm-workspace.yaml`, when ktoś dodaje paczkę opublikowaną mniej niż dobę temu,
  then instalacja ją pomija (odpowiednik `minimumReleaseAge` z `bunfig.toml`).

### W-02: Budowa bazy w repo (musi) (bez karty: infrastruktura)

Jako właściciel chcę mieć budowę bazy w migracjach w repo, aby lokalna baza i przyszła baza
produkcyjna powstawały z tych samych plików.

- W-02/K1: Given pusta baza lokalna, when `shctl db reset`, then powstają tabele `szkolenia`,
  `trenerzy`, `szkolenie_trener`, `user_roles`, typ `app_role`, funkcje `is_staff`, `is_admin`,
  `moje_role`, `has_role`, `dotknij_updated_at` z wyzwalaczami, polityki RLS i granty identyczne z
  chmurą.
- W-02/K2: Given baza lokalna po resecie i baza w chmurze, when porównać zapytaniami katalogowymi
  (tabele i kolumny z ograniczeniami, polityki, funkcje z `security definer` i `search_path`,
  granty), then wyniki są takie same (różnice tylko w obiektach Supabase poza schematem `public`).
- W-02/K3: Given `supabase/config.toml`, when `shctl db start`, then stack działa na porcie bloku
  projektu 55421–55429, a rejestracja nowych kont przez API jest wyłączona.

### W-03: Dane startowe lokalnej bazy (musi) (bez karty: dane, widoczne w W-04)

Jako właściciel chcę po uruchomieniu lokalnym widzieć pełną ofertę i móc wejść do panelu, aby
sprawdzać serwis jak na produkcji.

- W-03/K1: Given baza po `shctl db reset`, when gość otwiera katalog, then widzi 9 szkoleń z makiety w
  kolejności z makiety, z cenami i terminami z makiety.
- W-03/K2: Given baza po resecie, when gość otwiera listę trenerów, then widzi 6 trenerów z makiety, a
  na stronach szkoleń prowadzących według przypisań z makiety.
- W-03/K3: Given baza po resecie, when redaktor testowy loguje się do panelu, then panel się otwiera;
  when loguje się konto bez roli, then widzi ekran „Brak uprawnień”.
- W-03/K4: Given dane startowe, when przegląd, then nie zawierają danych prawdziwych osób (trenerzy z
  makiety są fikcyjni, decyzja właściciela 2026-11-12) ani haseł innych niż testowe lokalne.

### W-04: Uruchomienie lokalne z instrukcją (musi)

Jako właściciel chcę uruchomić serwis i panel na swoim komputerze według instrukcji, aby odbierać
zmiany bez publikacji. Karta: `funkcje/W-04.md`.

- W-04/K1…K4: w karcie.

### W-05: Testy zasad dostępu (musi) (bez karty: testy)

Jako właściciel chcę, aby zasady dostępu do bazy były sprawdzane automatycznie, aby żadna zmiana nie
odsłoniła szkiców ani nie pozwoliła na zapis bez roli.

- W-05/K1: Given szkolenie i trener w szkicu, when gość (anon) czyta tabele, then nie dostaje szkiców
  ani przypisań do szkiców.
- W-05/K2: Given zalogowane konto bez roli, when próbuje wstawić, zmienić albo usunąć szkolenie,
  trenera, przypisanie albo wiersz ról, then baza odmawia.
- W-05/K3: Given redaktor z rolą `editor`, when tworzy, publikuje, wycofuje i usuwa szkolenie i
  trenera oraz zmienia przypisania, then operacje się udają, a `published_at` ustawia się i czyści
  zgodnie z wyzwalaczem.
- W-05/K4: Given dowolne konto, when wywołuje `moje_role()` i `is_staff()`, then dostaje tylko własne
  role; gość dostaje pusty wynik i `false`.
- W-05/K5: Given `shctl db test` lokalnie i job bazy w CI, when testy biegną, then wszystkie
  przechodzą.

### W-06: Automatyczne sprawdzenia w GitHubie (musi) (bez karty: CI)

Jako właściciel chcę, aby każdy PR przechodził lint, typy, testy, build i sprawdzenie bazy, aby zmiany
nie psuły serwisu bez sygnału.

- W-06/K1: Given PR, when CI biegnie, then są joby: lint, typy, testy jednostkowe, build (pnpm) oraz
  job bazy przy zmianach w `supabase/` (migracje na czystej bazie, pgTAP, `db lint`).
- W-06/K2: Given celowo zepsuty test albo migracja, when CI biegnie, then odpowiedni job jest czerwony.
- W-06/K3: Given repo publiczne, when CI biegnie, then działa na runnerach GitHuba bez zmiennej
  `SH_RUNS_ON`.

### W-07: Bez zmian w działaniu serwisu (musi) (bez karty: regresja)

Jako właściciel chcę, aby M1 nie zmienił niczego, co widzi gość i redaktor, aby produkcja po
przenosinach zachowywała się jak dziś.

- W-07/K1: Given karty F-01…F-08 z analizy, when M1 jest zakończony, then „Zachowanie do zachowania” z
  każdej karty jest spełnione (testy stanu wyjściowego zielone, kod w `src/` bez zmian funkcjonalnych).
- W-07/K2: Given M1, when przegląd zmian, then obecna baza w chmurze i publikacja w Lovable nie zostały
  zmienione.

## Karty funkcji

| Wymaganie | Karta | Rodzaj (pelna, skrocona) | Ekrany z designu |
|---|---|---|---|
| W-04 | `funkcje/W-04.md` | skrocona | brak nowych ekranów; istniejące ekrany serwisu i panelu (karty F-01…F-08) |

Pozostałe wymagania nie mają funkcji użytkowej (powód w nagłówku).

## Lista startowa

`docs/00-intake/lista-startowa.md`: jedna pozycja (Docker Desktop na serwerze). Bez nowych kont,
kluczy, domen i płatnych usług; CI w publicznym repo bez opłat.

## Typ projektu

Web (TanStack Start: SSR + panel klienta) z lokalnym Supabase.

| Konsekwencja | Ustalenie |
|---|---|
| Narzędzia testowe | Vitest (stan wyjściowy), pgTAP przez `shctl db test` i job CI bazy; Playwright E2E poza M1 (scenariusz ręczny QA zostaje) |
| Dodatkowe punkty DoD | Porównanie budowy bazy lokalnej z chmurą (W-02/K2); testy stanu wyjściowego zielone (W-07) |
| Ograniczenia runnera | Supabase CLI nie działa w sandboksie workera: baza tylko przez `shctl db` (poza sandboksem) i CI; bun nie działa na serwerze (stąd W-01) |
| Kroki ręczne właściciela | Docker Desktop włączony na serwerze; odbiór M1 przez uruchomienie według instrukcji |

## Stack

| | Wybór | Uzasadnienie |
|---|---|---|
| Rekomendacja | Obecny stack (AGENTS.md, „Stałe dla tego projektu”) + pnpm + Supabase CLI z migracjami w `supabase/` i pgTAP | Zgodny z kontraktem procesu; nie zmienia aplikacji; migracje z repo są wymagane do przenosin |
| Alternatywa | Zostać przy bun i uruchamiać testy tylko w CI | Odrzucona: bun nie działa na serwerze, kontrakt wymaga pnpm, agenci nie sprawdziliby zmian lokalnie |

## Hosting

M1 działa lokalnie (bez hostingu). Docelowo, po przenosinach: Vercel + Supabase Cloud (region UE) na
kontach właściciela — `hosting` w `docs/konfiguracja.md`, `zaakceptowany: true` od checkpointu
specyfikacji. Wybór projektu Supabase dla produkcji (obecny w chmurze czy nowy) rozstrzyga zlecenie
przenosin.

## Design

Bez nowego designu: M1 nie zmienia ekranów. Obowiązują istniejące ekrany i teksty (karty F-01…F-08,
`src/styles.css` bez zmian). Właściciel nic nie dostarcza do `docs/00-intake/zrodla/`.

## Kroki ręczne właściciela

1. Docker Desktop na serwerze włączony na czas pracy agentów (lista startowa).
2. Checkpoint specyfikacji i planu.
3. Odbiór M1: uruchomienie serwisu u siebie według instrukcji z `README.md` (W-04).

## Ryzyka

| Obszar | Ocena (tak, nie, do ustalenia) | Skutek |
|---|---|---|
| Auth i RLS, role użytkowników | tak | ADR w 04-plan: „Budowa bazy 1:1 z chmury i testy RLS”. Wiadomo: polityki i funkcje z chmury (raport, przegląd 2026-11-12), uwagi advisora 0028/0029 i ochrona haseł poza M1. Plan rozstrzyga: sposób odtworzenia (odczyt katalogu przez MCP tylko do odczytu albo `db dump` od właściciela), metodę porównania, zakres testów pgTAP pozytywnych i negatywnych |
| Płatności | nie | — |
| Dane osobowe | nie | Dane startowe fikcyjne (W-03/K4); formularz kontaktu poza zakresem |
| AI przetwarzające dane użytkowników | nie | — |
| Migracje bazy produkcyjnej | nie | Bazy w chmurze nie zmieniamy w M1; migracja produkcyjna w zleceniu przenosin |
| Upload plików, integracje zewnętrzne | nie | — |
| Płatne usługi, sekrety, nowe konta | nie | CI w publicznym repo bez opłat; brak kluczy chmury na serwerze |
| Zmiana kontraktu stacku (bun → pnpm) | tak | ADR w 04-plan: „Przejście z bun na pnpm”. Wiadomo: bun nie działa na serwerze (SIGILL), kontrakt wymaga pnpm, decyzja właściciela 2026-11-12. Plan rozstrzyga: przeniesienie `minimumReleaseAge`, `allowBuilds`, wpływ na budowanie w Lovable do czasu przenosin |

## Szacunek poglądowy

| Miara | Wartość |
|---|---|
| Zadania | ok. 5 (pnpm; migracja bazowa; dane startowe i uruchomienie z instrukcją; testy RLS; CI) |
| Czas kalendarzowy | 1–2 dni pracy agentów po akceptacji planu |
| Czas właściciela | 20–30 min: dwa checkpointy, potwierdzenie Dockera, odbiór (uruchomienie według instrukcji) |

## Tryb procesu

Tryb M: zlecenie dotyka zasad dostępu w bazie i zmienia kontrakt narzędzi, więc wymaga planu z ADR;
około 5 zadań. Zlecono 2026-11-12T22:38Z.

## Do potwierdzenia

| Nr | Karta | Pytanie albo założenie | Proponowana odpowiedź | Źródło (zdecyduj sam, luka bez pytania) |
|---|---|---|---|---|
| Z1 | W-04 | Konto testowego redaktora | Adres redaktor@szkolenia.local z prostym hasłem testowym opisanym w instrukcji; działa tylko na bazie lokalnej | potwierdzone przez właściciela 2026-11-12 |
| Z2 | W-04 | Drugie konto bez roli | Tak: bez-roli@szkolenia.local, do sprawdzenia ekranu „Brak uprawnień” i testów | potwierdzone przez właściciela 2026-11-12 |
| Z3 | W-03 | Dane trenerów z makiet | Fikcyjne osoby, mogą być w danych startowych | potwierdzone przez właściciela 2026-11-12 |
| Z4 | — | Uwagi z kontroli bezpieczeństwa Supabase | Budowa bazy 1:1 z chmurą w M1, poprawki osobnym zleceniem | luka bez pytania |
| Z5 | — | Baza docelowa przy przenosinach | Rozstrzyga zlecenie przenosin (obecny projekt w chmurze albo nowy) | luka bez pytania |
