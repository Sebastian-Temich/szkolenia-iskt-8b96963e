# ADR-005: Wdrożenie bazy produkcyjnej na istniejącym projekcie Supabase

Status: proponowana
Data: 2026-11-16

## Kontekst

Cykl M4, krok 1 (`docs/00-intake/specyfikacja.md`, W-15…W-17). Produkcja używa istniejącego
projektu Supabase vwnvbhiuundeunyzhdxj (decyzje.md 2026-11-16), co zastępuje zasadę „obecnej bazy w
chmurze nie zmieniamy” (2026-11-12) i wariant „nowy projekt z migracji” z ADR-001. Odczyt 2026-11-16:
schemat 1:1 z migracją bazową `20261112232552_baza.sql` (ADR-001), puste treści, 1 konto admin, brak
historii migracji. Plan darmowy, bez kopii (Z3: baza pusta). Agenci nie mają dostępu do produkcji;
orkiestrator czyta bazę przez MCP tylko do odczytu (zgoda 2026-11-12). Obszary ryzyka: migracje bazy
produkcyjnej, RLS i role, dane osobowe (e-maile kont), sekrety (hasło bazy).

## Decyzja

1. **Przyjęcie istniejącego schematu.** Przed zmianą skrypt `supabase/produkcja/01-sprawdz-baze.sql`
   (tylko odczyt) potwierdza zgodność z migracją bazową: lista tabel, kolumn, funkcji, zasad RLS i
   ACL jak w `docs/cykle/M1/04-plan/schemat-chmury.md`. Przy zgodności właściciel oznacza migrację
   bazową jako zastosowaną: `supabase migration repair --status applied 20261112232552` (bez
   wykonania SQL). Przy niezgodności przerywa i zgłasza wynik (bez repair).
2. **Wgranie M2.** `supabase db push` wykonuje `20261113204457_uprawnienia_funkcji_rol.sql` (ADR-003)
   i wpisuje ją do historii. Po nim `01-sprawdz-baze.sql` w trybie „po M2” potwierdza: brak `EXECUTE`
   dla anon i PUBLIC na `is_staff`, `is_admin`, `moje_role`; jedna zasada SELECT na rolę i tabelę.
3. **Dane startowe.** `supabase/produkcja/02-dane-startowe.sql`: 9 szkoleń z `supabase/seed.sql`
   (status `published`, Z2), bez trenerów, przypisań i kont testowych, `insert … on conflict (id) do
   nothing` (idempotentne). Uruchamia właściciel w SQL Editor dashboardu. Lokalny `seed.sql` zostaje
   bez zmian (dane testowe tylko lokalnie i w CI).
4. **Logowanie i role.** Ustawienia logowania produkcji właściciel wpisuje w dashboardzie
   (Authentication → URL Configuration i Sign In / Providers), bo `supabase/config.toml` opisuje stos
   lokalny: Site URL `https://szkolenia.iskt.pl`, Redirect URLs `https://szkolenia.iskt.pl/**`,
   rejestracja wyłączona, minimalna długość hasła 8, wymagania „lowercase, uppercase letters and
   digits”. Konta redakcji właściciel tworzy w dashboardzie (Add user → Create new user, z hasłem,
   Auto Confirm, Z4); hasła przekazuje osobnym kanałem (telefon, SMS), nigdy w repo, e-mailu z
   repo ani u agentów, i prosi o zmianę hasła, gdy panel dostanie ekran zmiany hasła (backlog).
   `supabase/produkcja/03-role.sql` nadaje rolę `editor` kontom podanym przez e-mail w jednym miejscu
   na górze skryptu (właściciel wpisuje adresy w SQL Editor przed uruchomieniem; w repo stoją
   przykładowe adresy z `example.com`), idempotentnie, bez zmiany roli admin.
5. **Rollback bez kopii (Z3).** `supabase/produkcja/09-cofnij.sql`: przywraca ACL funkcji ról i zasady
   SELECT sprzed M2 (odwrotność migracji M2, jak w schemacie chmury), usuwa 9 szkoleń startowych (po
   `id` z listy, tylko gdy nie ma przypisań trenerów), usuwa wpis M2 z
   `supabase_migrations.schema_migrations`. Zostawia konto admin i jego rolę, konta redakcji i
   ustawienia logowania (świadomie: nie zależą od M2; usuwa je właściciel ręcznie, jeśli chce).
   Po cofnięciu `01-sprawdz-baze.sql` w trybie „przed M2” przechodzi.
6. **Hasło bazy i sekrety.** `supabase link --project-ref vwnvbhiuundeunyzhdxj` pyta o hasło bazy
   interaktywnie; hasło zostaje tylko u właściciela. Skrypty i instrukcja nie zawierają sekretów ani
   adresów e-mail redakcji.
7. **Testy w CI (job `baza`).** Na czystej bazie z migracji: `02-dane-startowe.sql` dwa razy (9
   szkoleń, bez duplikatów), `03-role.sql` z kontami testowymi (rola editor, admin bez zmian),
   `01-sprawdz-baze.sql` „po M2” bez błędów, `09-cofnij.sql` i `01-sprawdz-baze.sql` „przed M2” bez
   błędów, ponowne `db push` (ponowne zastosowanie M2) przechodzi. Skrypty uruchamia test pgTAP albo
   krok CI przez `psql`.
8. **Kolejne wdrożenia.** Automatyczne wdrażanie migracji z CI (odpowiedź 5) wymaga sekretu połączenia
   z produkcją w GitHub, co zmienia zasadę „na serwerze i w GitHub Secrets nie ma poświadczeń
   produkcyjnych”: osobna decyzja właściciela i ADR w kroku Vercel.

## Rozważane opcje

- **Nowy projekt Supabase z migracji** (ADR-001, 2026-11-12): czysta historia, ale właściciel wybrał
  istniejący projekt (odpowiedź 1).
- **Migracje przez SQL Editor bez CLI:** bez historii migracji; kolejne wdrożenia nie wiedziałyby, co
  jest zastosowane. Odrzucone.
- **Kopia `db dump` przed zmianą:** zbędna przy pustej bazie (Z3); wraca przy kolejnych wdrożeniach z
  danymi.

## Konsekwencje

- Baza produkcyjna ma historię migracji zgodną z repo; kolejne migracje idą przez `db push`.
- ADR-001 pkt „baza w chmurze bez zmian” przestaje obowiązywać dla projektu vwnvbhiuundeunyzhdxj;
  `AGENTS.md` (sekcja Lovable) dostaje nową zasadę: zmiany w bazie produkcyjnej tylko migracjami z
  repo, wykonuje właściciel.
- Plan darmowy: usypianie po 7 dniach bez ruchu i brak automatycznych kopii (znane ryzyko do decyzji o
  planie Pro).
- Cofnięcie: `09-cofnij.sql` (pkt 5).
