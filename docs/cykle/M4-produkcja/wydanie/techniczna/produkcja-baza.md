# Wdrożenie bazy produkcyjnej (Supabase vwnvbhiuundeunyzhdxj)

Instrukcja dla właściciela. Decyzja i uzasadnienie: `docs/04-plan/adr/ADR-005-wdrozenie-bazy-produkcyjnej.md`
(pkt 1–9), wymagania W-15, W-16, W-17. Skrypty: `supabase/produkcja/`, sprawdzane w CI (job `baza`,
`supabase/produkcja/ci/test-skryptow.sh`) na czystej bazie z migracji.

## Zasady

- Wszystkie kroki wykonujesz Ty, ze swojego komputera i w dashboardzie Supabase. Agenci nie łączą się
  z produkcją.
- Hasło bazy podajesz tylko interaktywnie (`supabase link`). Nie zapisujesz go w repo, plikach,
  notatkach ani w rozmowie z agentami.
- Prawdziwe adresy e-mail redakcji wpisujesz tylko w SQL Editor (krok 12). W repo stoją adresy
  przykładowe `@example.com`.
- Hasła kont redakcji przekazujesz osobnym kanałem (telefon, SMS), nigdy e-mailem ani przez repo.
- Kroki wykonujesz po kolei. Gdy wynik różni się od „Oczekiwanego wyniku”, robisz to, co mówi „Przy
  błędzie”, i nie idziesz dalej.
- Skrypt w SQL Editor uruchamiasz zawsze tak samo: Dashboard → SQL Editor → **New query** → wklejasz
  **całą** treść pliku z repo → zmieniasz tylko linię w ramce „PARAMETR” (jeśli skrypt ją ma) →
  **Run**. Zapytania z prawdziwymi adresami e-mail nie zapisujesz (nie klikasz „Save”).

## Kolejność w skrócie

| Krok | Gdzie | Co | ADR-005 |
|---|---|---|---|
| 1 | Terminal | Repo na aktualnym `main` | — |
| 2 | Terminal | `supabase link` | pkt 6 |
| 3 | Terminal | `supabase migration list` (historia pusta) | pkt 1 |
| 4 | SQL Editor | `01-sprawdz-baze.sql`, tryb `przed-M2` | pkt 1 |
| 5 | Terminal | `supabase migration repair --status applied 20261112232552` | pkt 1 |
| 6 | Terminal | `supabase db push` (migracja M2) | pkt 2 |
| 7 | Terminal | `supabase migration list` (obie migracje) | pkt 2 |
| 8 | SQL Editor | `01-sprawdz-baze.sql`, tryb `po-M2` | pkt 2, 9 |
| 9 | SQL Editor | `02-dane-startowe.sql` | pkt 3 |
| 10 | Dashboard | Ustawienia logowania | pkt 4 |
| 11 | Dashboard | Dwa konta redakcji | pkt 4 |
| 12 | SQL Editor | `03-role.sql` | pkt 4 |
| 13 | SQL Editor | `01-sprawdz-baze.sql`, tryb `po-M2` (kontrola końcowa) | pkt 9 |
| 14 | Twój komputer | Logowanie redakcji przez lokalną aplikację z adresem produkcji | pkt 9 |
| 15 | Terminal | `supabase unlink` | pkt 6 |

Cofnięcie: sekcja „Rollback” na końcu.

## Kroki

### 1. Repo na aktualnym `main`

Polecenia (w katalogu swojej kopii repo):

```sh
git switch main
git pull
supabase --version
```

Oczekiwany wynik: `git pull` kończy się bez błędu, w `supabase/migrations/` są dokładnie dwa pliki:
`20261112232552_baza.sql` i `20261113204457_uprawnienia_funkcji_rol.sql`; `supabase --version`
pokazuje wersję 2.x (CI używa 2.121.0).

Przy błędzie: konflikt albo zmiany lokalne w `git pull` rozwiązujesz przed dalszymi krokami. Inna
liczba migracji niż dwie: zatrzymaj się i zgłoś orkiestratorowi (ta instrukcja dotyczy tylko M2).

### 2. Połączenie z projektem produkcyjnym

```sh
supabase login
supabase link --project-ref vwnvbhiuundeunyzhdxj
```

`supabase login` tylko wtedy, gdy CLI nie jest zalogowane. `supabase link` pyta o hasło bazy: wpisujesz
je ręcznie (Dashboard → Project Settings → Database, jeśli trzeba je zresetować).

Oczekiwany wynik: `Finished supabase link.`

Przy błędzie: „password authentication failed” → sprawdź hasło (bez zapisywania go); brak dostępu do
projektu → zaloguj się kontem właściciela projektu (`supabase login`).

### 3. Historia migracji przed zmianą

```sh
supabase migration list
```

Oczekiwany wynik: kolumna `Local` ma `20261112232552` i `20261113204457`, kolumna `Remote` jest pusta
w obu wierszach (baza produkcyjna nie ma historii migracji).

Przy błędzie: `Remote` nie jest pusta → zatrzymaj się, nie wykonuj kroków 5–6, przekaż wynik
orkiestratorowi.

### 4. Zgodność schematu przed zmianą (tylko odczyt)

SQL Editor: `supabase/produkcja/01-sprawdz-baze.sql`. W ramce „PARAMETR” zmień `'po-M2'` na
`'przed-M2'`:

```sql
select set_config('produkcja.tryb', 'przed-M2', false);
```

Oczekiwany wynik: jeden wiersz `tryb = przed-M2`, `wynik = ZGODNA`, `historia_migracji = NULL`,
`opublikowane_szkolenia = 0`.

Przy błędzie: komunikat `NIEZGODNOŚĆ (tryb przed-M2): N różnic …` z listą linii `BRAK: …` (oczekiwane,
a nie ma w bazie) i `NADMIAR: …` (jest w bazie, a nie oczekiwano). **Nie wykonujesz `migration repair`
ani `db push`.** Kopiujesz cały komunikat (nie zawiera haseł ani danych osobowych) i przekazujesz
orkiestratorowi; decyzja, co dalej, zapada w `docs/decyzje.md` (ADR-005 pkt 1).

### 5. Oznaczenie migracji bazowej jako zastosowanej

Schemat produkcji jest już identyczny z migracją bazową, więc oznaczasz ją bez wykonywania SQL:

```sh
supabase migration repair --status applied 20261112232552
supabase migration list
```

Oczekiwany wynik: `Repaired migration history: [20261112232552] => applied`; w `migration list`
wiersz `20261112232552` ma wartość w `Remote`, wiersz `20261113204457` nie.

Przy błędzie: komunikat o połączeniu → wróć do kroku 2. Repair na złej wersji →
`supabase migration repair --status reverted WERSJA` cofa wpis (sama historia, bez SQL).

### 6. Wgranie migracji M2

```sh
supabase db push --dry-run
supabase db push
```

Oczekiwany wynik: `--dry-run` wypisuje tylko `20261113204457_uprawnienia_funkcji_rol.sql`. `db push`
pyta o potwierdzenie (odpowiadasz `Y`) i kończy się `Finished supabase db push.` Seed nie jest
wysyłany (`db push` bez `--include-seed`).

Przy błędzie: `--dry-run` pokazuje inną albo dodatkową migrację → nie uruchamiasz `db push`, wróć do
kroku 1. Błąd SQL w `db push` → migracja wykonuje się w transakcji, więc baza zostaje bez zmian:
uruchom krok 4 jeszcze raz (tryb `przed-M2`, historia pokaże wtedy `20261112232552`) i przekaż
komunikat orkiestratorowi.

### 7. Historia migracji po zmianie

```sh
supabase migration list
```

Oczekiwany wynik: oba wiersze mają tę samą wartość w `Local` i `Remote`.

Przy błędzie: brak `20261113204457` w `Remote` → powtórz krok 6.

### 8. Zgodność schematu po M2 i symulacja ról (tylko odczyt)

SQL Editor: `supabase/produkcja/01-sprawdz-baze.sql` bez zmian (PARAMETR `'po-M2'`).

Oczekiwany wynik: `tryb = po-M2`, `wynik = ZGODNA`, `historia_migracji = 20261112232552,20261113204457`.
Skrypt sprawdził przy tym (ADR-005 pkt 2 i 9): gość (`anon`) nie ma `EXECUTE` na `is_staff`,
`is_admin`, `moje_role`, każda tabela ma jedną zasadę SELECT na rolę, gość widzi tylko opublikowane
szkolenia i trenerów, a zalogowane konto bez roli dostaje `is_staff() = false` (panel pokaże „Brak
uprawnień”).

Przy błędzie: `NIEZGODNOŚĆ (tryb po-M2) …` → nie idziesz dalej; przekaż komunikat orkiestratorowi.
Gdy trzeba wrócić do stanu sprzed wdrożenia, wykonaj „Rollback”.

### 9. Dane startowe: 9 szkoleń

SQL Editor: `supabase/produkcja/02-dane-startowe.sql` bez zmian.

Oczekiwany wynik: 9 wierszy (`genai`, `esg`, `eng-b2`, `fullstack`, `ai-agents`, `co2`, `python`,
`grants`, `eng-it`), każdy ze `status = published` i `opublikowane = true`. Trenerów, przypisań ani
kont skrypt nie dodaje. Ponowne uruchomienie daje ten sam wynik (nic się nie dubluje).

Przy błędzie: `duplicate key value violates unique constraint "szkolenia_sort_order_key"` → w bazie
jest już inne szkolenie z tą samą pozycją (`sort_order` 1–9); skrypt nic nie zapisał, przekaż komunikat
orkiestratorowi.

### 10. Ustawienia logowania (dashboard)

`supabase/config.toml` opisuje tylko bazę lokalną, więc produkcję ustawiasz ręcznie:

1. Authentication → **URL Configuration**:
   - Site URL: `https://szkolenia.iskt.pl`
   - Redirect URLs: dodaj `https://szkolenia.iskt.pl/**`
2. Authentication → **Sign In / Providers**:
   - „Allow new users to sign up”: **wyłączone** (rejestracja wyłączona);
   - Email: „Minimum password length” = `8`, „Password Requirements” = **Lowercase, uppercase letters
     and digits**.
3. **Save** w każdej sekcji.

Oczekiwany wynik: po odświeżeniu strony wartości są takie jak wyżej.

Przy błędzie: dashboard nie zapisuje zmian → sprawdź, czy jesteś zalogowany kontem właściciela
projektu, i powtórz.

### 11. Konta redakcji (dashboard)

Dla każdej z 2 osób: Authentication → **Users** → **Add user** → **Create new user**:

- Email: adres osoby z redakcji;
- Password: nowe hasło spełniające wymagania z kroku 10 (min. 8 znaków, małe i wielkie litery,
  cyfry), najlepiej z menedżera haseł;
- **Auto Confirm User**: zaznaczone.

Hasło przekazujesz tej osobie osobnym kanałem (telefon, SMS). Poproś o zmianę hasła, gdy panel dostanie
ekran zmiany hasła (backlog).

Oczekiwany wynik: oba konta na liście Users, z datą w kolumnie potwierdzenia (bez „Waiting for
verification”).

Przy błędzie: „User already registered” → konto już jest; sprawdź tylko, czy jest potwierdzone.

### 12. Rola editor dla redakcji

SQL Editor: `supabase/produkcja/03-role.sql`. W ramce „PARAMETR” zamień adresy przykładowe na adresy
kont z kroku 11, rozdzielone przecinkiem:

```sql
select set_config('produkcja.redakcja', 'pierwszy.adres@domena,drugi.adres@domena', false);
```

Oczekiwany wynik: 2 wiersze (`email`, `role = editor`). Ponowne uruchomienie daje ten sam wynik. Konto
z rolą `admin` podane w parametrze jest pomijane (rola admin bez zmian). Zapytania nie zapisujesz
(„Save”), bo zawiera adresy e-mail.

Przy błędzie: `Brak kont dla adresów: …` → literówka w adresie albo konto nie istnieje (krok 11); skrypt
nic nie zmienił, popraw i uruchom ponownie.

### 13. Kontrola końcowa (tylko odczyt)

SQL Editor: `supabase/produkcja/01-sprawdz-baze.sql` bez zmian (PARAMETR `'po-M2'`).

Oczekiwany wynik: `wynik = ZGODNA`, `historia_migracji = 20261112232552,20261113204457`,
`opublikowane_szkolenia = 9`.

Przy błędzie: jak w kroku 8.

### 14. Logowanie redakcji przez lokalną aplikację

Sprawdzasz, że konto redaktora loguje się do `/panel` na produkcyjnej bazie. Frontend nie jest jeszcze
wdrożony (Vercel to osobny krok), więc uruchamiasz aplikację lokalnie z adresem produkcji:

1. W katalogu repo utwórz plik `.env.production.local` (pliki `*.local` są w `.gitignore`, nie trafiają
   do repo) z dwiema zmiennymi:
   - `VITE_SUPABASE_URL=https://vwnvbhiuundeunyzhdxj.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=` klucz z Dashboard → Project Settings → API Keys →
     „Publishable key” (klucz publiczny; **nie** wpisujesz klucza `service_role` / secret).
2. Uruchom aplikację w trybie, który czyta ten plik:

   ```sh
   pnpm install
   pnpm dev --mode production
   ```

3. Otwórz adres wypisany w terminalu (`Local: http://localhost:…`): `/szkolenia` pokazuje 9 szkoleń;
   `/panel` → logowanie kontem redaktora → panel z listą szkoleń.
4. Zatrzymaj serwer i **usuń** `.env.production.local`, żeby kolejne lokalne uruchomienia nie łączyły
   się z produkcją.

Oczekiwany wynik: katalog i szczegóły szkoleń z produkcji, redaktor zalogowany w panelu (bez „Brak
uprawnień”).

Przy błędzie: „Brak uprawnień” → konto nie ma roli (powtórz krok 12 z tym adresem); błąd logowania
„Invalid login credentials” → złe hasło albo konto niepotwierdzone (krok 11); brak szkoleń → sprawdź
krok 9 i czy adres w `.env.production.local` to projekt `vwnvbhiuundeunyzhdxj`. Uwaga: w panelu
redaktor pracuje na **produkcji**; zmiany testowe cofnij od razu.

### 15. Odłączenie CLI od produkcji

```sh
supabase unlink
```

Oczekiwany wynik: `Finished supabase unlink.` Kolejne polecenia `supabase` w tym katalogu nie trafią
przypadkiem do produkcji (a `shctl db` nie odmówi pracy na bazie lokalnej).

Przy błędzie: brak — gdy polecenie nie istnieje w Twojej wersji CLI, usuń katalog `supabase/.temp/`.

## Rollback

Kiedy: krok 8 albo 13 daje niezgodność, której nie da się szybko wyjaśnić, albo decyzja właściciela o
wycofaniu M4. Decyduje właściciel; orkiestrator zapisuje decyzję w `docs/decyzje.md`. Kopii zapasowej
nie ma (plan darmowy, baza była pusta, Z3), więc cofnięcie to skrypt.

1. SQL Editor: `supabase/produkcja/09-cofnij.sql` bez zmian.
   Oczekiwany wynik: `wynik = COFNIĘTE`, w `szczegoly` liczba usuniętych szkoleń startowych (9, albo
   mniej, gdy któreś ma przypisanego trenera: wtedy jest wypisane i zostaje) i liczba usuniętych wpisów
   historii migracji (2). Komunikaty `policy … does not exist, skipping` są normalne.
2. SQL Editor: `supabase/produkcja/01-sprawdz-baze.sql` z PARAMETREM `'przed-M2'` (jak w kroku 4).
   Oczekiwany wynik: `ZGODNA`, `historia_migracji = NULL`.
3. Terminal (po `supabase link`, krok 2): `supabase migration list`.
   Oczekiwany wynik: kolumna `Remote` pusta.

Co zostaje (świadomie, ADR-005 pkt 5): konto admin i jego rola, konta redakcji z rolą editor, ustawienia
logowania z kroku 10. Usuwasz je ręcznie w dashboardzie, jeśli chcesz. Ponowne wdrożenie po rollbacku:
od kroku 1.

Przy błędzie: `09-cofnij.sql` wykonuje się w całości albo wcale; po błędzie baza jest bez zmian.
Przekaż komunikat orkiestratorowi.

## Znane ograniczenia

- `01-sprawdz-baze.sql` porównuje z dokładnie dwiema migracjami (bazowa i M2). Każda kolejna migracja
  wymaga nowej wersji skryptu.
- Plan darmowy: projekt usypia się po 7 dniach bez ruchu i nie ma automatycznych kopii (ADR-005,
  „Konsekwencje”).
- Automatyczne wdrażanie migracji z CI nie istnieje: wymaga sekretu produkcji w GitHub, osobnej decyzji
  i ADR (ADR-005 pkt 8).
