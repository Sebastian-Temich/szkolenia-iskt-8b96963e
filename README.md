# Szkolenia ISKT

Serwis szkolenia.iskt.pl: publiczna oferta szkoleń ISKT (strona główna, katalog z filtrami, szczegół
szkolenia z ceną i terminami, trenerzy) i panel redakcyjny do zarządzania szkoleniami i trenerami.

## Cel

Projekt powstał w Lovable i jest rozwijany dalej w procesie AI Software House. Pierwszy etap (M1):
serwis i panel działają lokalnie na bazie zbudowanej wyłącznie z plików w repo, z danymi startowymi z
makiet, a zasady dostępu do bazy i cały kod są sprawdzane automatycznie w GitHubie. Działanie serwisu
dla gości i redaktorów się nie zmienia.

Szczegóły: [specyfikacja M1](docs/00-intake/specyfikacja.md), stan wyjściowy:
[raport analizy](docs/00-analiza/raport.md).

## Zakres

- W M1: przejście na pnpm, budowa bazy w migracjach (`supabase/`), dane startowe, uruchomienie
  lokalne z instrukcją, testy zasad dostępu, CI.
- Później, osobnymi zleceniami: zmiany funkcji, wysyłka formularza kontaktu, a na końcu migracja na
  bazę produkcyjną w chmurze i przeniesienie z Lovable na Vercel.
- Produkcja działa dziś na Lovable; publikację w Lovable wykonuje wyłącznie właściciel.

## Uruchomienie lokalne

Serwis i panel na bazie lokalnej, zbudowanej wyłącznie z plików w repo (`supabase/migrations/`) i
danych startowych z makiet (`supabase/seed.sql`). Nic nie trafia do bazy w chmurze ani do Lovable.
Komendy uruchamiasz w katalogu repo (główna kopia albo worktree zadania).

### Wymagania

- Docker Desktop włączony (baza lokalna Supabase działa w kontenerach).
- Node LTS przez fnm: `fnm install --lts`, potem `fnm use lts-latest`.
- pnpm w wersji z pola `packageManager` w `package.json` (`corepack enable` albo instalacja pnpm),
  zależności: `pnpm install`.
- `shctl` (narzędzie serwera, `/Users/Shared/sh/bin/shctl`).

### Kroki

1. Włącz bazę lokalną:

   ```sh
   shctl db start --projekt szkolenia-iskt
   ```

2. Wczytaj schemat i dane startowe (9 szkoleń, 6 trenerów, konta testowe). Komenda kasuje dane bazy
   lokalnej i odtwarza ją od zera:

   ```sh
   shctl db reset --projekt szkolenia-iskt
   ```

3. Uzupełnij `.env.local` (wzór: `.env.example`, plik nie trafia do repo) wartościami bazy lokalnej
   z `shctl db status --projekt szkolenia-iskt --json`:

   ```sh
   VITE_SUPABASE_URL=            # pole "api", czyli http://127.0.0.1:55421
   VITE_SUPABASE_PUBLISHABLE_KEY= # pole "publishable_key" (lokalny klucz publiczny)
   ```

   Wpisujesz tylko wartości bazy lokalnej. Kluczy z chmury nie wpisujesz.

4. Uruchom serwis:

   ```sh
   pnpm dev
   ```

5. Otwórz w przeglądarce <http://localhost:8080>:
   - <http://localhost:8080/>: strona główna z polecanymi szkoleniami,
   - <http://localhost:8080/szkolenia>: katalog, 9 szkoleń,
   - <http://localhost:8080/trenerzy>: 6 trenerów,
   - <http://localhost:8080/panel>: panel redakcyjny (logowanie kontem testowym niżej).

6. Po pracy wyłącz bazę. Dane zostają do następnego `shctl db start`:

   ```sh
   shctl db stop --projekt szkolenia-iskt
   ```

### Konta testowe (tylko lokalnie)

Zakłada je `supabase/seed.sql` wyłącznie w bazie lokalnej i w CI. Te hasła są testowe i jawne: tylko
lokalnie, nigdy w chmurze ani na produkcji.

| Konto | Hasło | Rola | Co widać w panelu |
|---|---|---|---|
| `redaktor@szkolenia.local` | `redaktor-lokalnie` | `editor` | lista szkoleń i trenerów |
| `bez-roli@szkolenia.local` | `bez-roli-lokalnie` | brak | ekran „Brak uprawnień” |

### Gdy coś nie działa

- Sprawdź stan bazy: `shctl db status --projekt szkolenia-iskt`. Pokazuje adres API (`http://127.0.0.1:55421`)
  i lokalne klucze; gdy baza nie działa, uruchom ją krokiem 1.
- Katalog pokazuje „Nie udało się wczytać katalogu”: baza wyłączona, Docker nie działa albo
  `.env.local` ma zły adres lub klucz. Porównaj `.env.local` z `shctl db status` i uruchom `pnpm dev`
  ponownie (Vite czyta `.env.local` przy starcie).
- Panel pokazuje „Panel nie jest skonfigurowany”: w `.env.local` brakuje `VITE_SUPABASE_URL` albo
  `VITE_SUPABASE_PUBLISHABLE_KEY` (krok 3).
- Katalog pokazuje „Brak szkoleń dla tych kryteriów” bez filtrów albo logowanie nie przechodzi: brak
  danych startowych, wykonaj krok 2.
- `shctl db start` kończy się błędem: włącz Docker Desktop i powtórz. Porty bazy to blok
  55421–55429; `shctl` odmawia, gdy działa baza innego projektu (zatrzymaj ją jej `shctl db stop`).

Zasady pracy agentów: [AGENTS.md](AGENTS.md).
