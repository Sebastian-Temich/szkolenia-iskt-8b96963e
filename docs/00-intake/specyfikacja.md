# Specyfikacja: M4 Produkcja, krok 1: baza danych w chmurze

Zlecenie: `docs/00-intake/zrodlo.md`. Zlecono (UTC): 2026-11-16T10:40Z.

## Cel i kontekst

Problem: aplikacja działa lokalnie na bazie z migracji repo (M1–M3), a produkcja ma powstać na
Vercel (decyzje.md 2026-11-16). Baza w chmurze (projekt Supabase vwnvbhiuundeunyzhdxj) ma schemat
1:1 z migracją bazową M1, ale bez historii migracji, bez zabezpieczeń z M2 (ADR-003) i bez treści.
Rezultat: baza w chmurze zgodna z migracjami repo, z ofertą startową i kontami redakcji, gotowa do
podłączenia aplikacji na Vercel (krok 2, osobny cykl).

Stan obecny: specyfikacje poprzednich cykli w `docs/cykle/*/00-intake/`; schemat chmury
`docs/cykle/M1/04-plan/schemat-chmury.md`; ADR-001 (baza z migracji), ADR-003 (uprawnienia). Odczyt
z 2026-11-16 (`zrodlo.md`): treści puste, 1 konto admin, brak historii migracji. Ten sam projekt
obsługuje dziś stronę na Lovable (nieopublikowane zmiany z repo), więc zmiany bazy widzi też Lovable.

Zmiana zasady: „obecnej bazy w chmurze nie zmieniamy” (decyzje.md 2026-11-12) zastępuje decyzja
właściciela z 2026-11-16: produkcja na istniejącym projekcie.

## Użytkownicy

| Grupa | Potrzeba | Uprawnienia |
|---|---|---|
| Właściciel (admin) | Bezpiecznie wgrać schemat i dane, zaprosić redakcję | Konto Supabase (dashboard, CLI), rola admin w aplikacji |
| Redakcja (2 osoby) | Logować się do panelu i redagować ofertę | Rola editor w aplikacji, zaproszenie z dashboardu |
| Odwiedzający | Zobaczyć ofertę szkoleń | anon: tylko opublikowane treści |

## Zakres

W zakresie:

- Wpisanie historii migracji dla schematu, który już jest w chmurze (migracja bazowa jako
  zastosowana), i wgranie migracji M2 (ADR-003) do chmury (W-15).
- Kopia zapasowa schematu i danych przed zmianą oraz sprawdzenie schematu po zmianie (W-15).
- Treści startowe: 9 szkoleń z repo, bez fikcyjnych trenerów (W-16).
- Ustawienia logowania produkcji (adres strony, przekierowania, rejestracja wyłączona, wymagania
  haseł) i role dla 2 zaproszonych osób (W-17).
- Instrukcja krok po kroku dla właściciela i skrypty sprawdzające (W-15…W-17).

Poza zakresem:

- Hosting na Vercel, klucze w Vercel, przełączenie domeny (kolejny krok, osobny cykl).
- Automatyczne wdrażanie migracji z CI (odpowiedź 5: „kolejne to już automat”; osobna decyzja i ADR
  przy kroku Vercel).
- Plan Pro, ochrona przed wyciekniętymi hasłami (tylko Pro), własny serwer poczty dla logowania
  (odpowiedź 4: poczta Supabase na razie).
- Prawdziwi trenerzy (dodaje redakcja w panelu), publikacja w Lovable.

## Wymagania

### W-15: Schemat produkcyjny zgodny z migracjami repo (musi) (bez karty: operacja na bazie wykonywana przez właściciela, bez nowego ekranu)

Jako właściciel chcę, aby baza w chmurze miała dokładnie schemat z migracji repo i ich historię, aby
kolejne wdrożenia szły zwykłą ścieżką migracji.

- Given baza w chmurze bez historii migracji, when właściciel wykona instrukcję, then historia
  zawiera migrację bazową (oznaczoną jako zastosowana, bez ponownego wykonania) i migrację M2
  (wykonaną).
- Given baza po zmianie, when uruchomimy sprawdzenie schematu, then funkcje ról nie są dostępne dla
  anon, a każda tabela treści ma jedną zasadę odczytu na rolę (jak lokalnie po M2).
- Given zmiana się nie powiedzie, when właściciel użyje kopii zapasowej z kroku przed zmianą, then
  baza wraca do stanu sprzed zmiany.

### W-16: Oferta startowa w produkcji (musi) (bez karty: dane startowe, ekrany bez zmian)

Jako odwiedzający chcę zobaczyć ofertę szkoleń na produkcji, aby wybrać szkolenie.

- Given pusta tabela szkoleń w chmurze, when właściciel wgra dane startowe, then baza ma 9
  opublikowanych szkoleń z repo, bez trenerów i bez kont testowych.
- Given dane startowe już wgrane, when skrypt zostanie uruchomiony ponownie, then nic się nie dubluje.

### W-17: Logowanie i konta redakcji w produkcji (musi) (bez karty: ustawienia i role, ekran panelu bez zmian)

Jako właściciel chcę, aby logowanie produkcji było skonfigurowane jak lokalnie, a 2 zaproszone osoby
miały rolę redaktora, aby redakcja mogła pracować bez dostępu do niczego więcej.

- Given ustawienia logowania w chmurze, when właściciel je zmieni według instrukcji, then adres strony
  to https://szkolenia.iskt.pl, rejestracja jest wyłączona, hasła mają co najmniej 8 znaków z małymi
  i wielkimi literami oraz cyframi.
- Given 2 osoby zaproszone z dashboardu Supabase, when przyjmą zaproszenie i właściciel nada role
  skryptem, then obie mają rolę editor, a właściciel zostaje admin.
- Given konto bez roli, when loguje się do panelu, then widzi „Brak uprawnień” (jak lokalnie).

## Karty funkcji

Brak funkcji użytkowej w tym kroku: W-15…W-17 to operacje na bazie i ustawieniach (nagłówki „bez
karty”). Ekrany serwisu i panelu bez zmian.

| Wymaganie | Karta | Rodzaj (pelna, skrocona) | Ekrany z designu |
|---|---|---|---|
| W-15 | bez karty | nie dotyczy | nie dotyczy |
| W-16 | bez karty | nie dotyczy | istniejący katalog |
| W-17 | bez karty | nie dotyczy | istniejący panel |

## Lista startowa

Rzeczy zewnętrzne od właściciela: `docs/00-intake/lista-startowa.md`. Realizacja nie startuje,
dopóki lista nie jest kompletna.

## Typ projektu

Web (bez zmian).

| Konsekwencja | Ustalenie |
|---|---|
| Narzędzia testowe | pgTAP i job `baza` (migracje na czystej bazie), skrypt sprawdzający schemat produkcji (SQL tylko do odczytu), test idempotencji danych startowych w CI |
| Dodatkowe punkty DoD | Kopia zapasowa przed zmianą; brak sekretów (hasło bazy, klucze) w repo i logach |
| Ograniczenia runnera | Agenci nie mają dostępu do produkcji; orkiestrator może tylko czytać bazę przez MCP (zgoda 2026-11-12) |
| Kroki ręczne właściciela | Kopia, `supabase link`, `migration repair`, `db push`, dane startowe, ustawienia logowania, zaproszenia i role |

## Stack

| | Wybór | Uzasadnienie |
|---|---|---|
| Rekomendacja | Supabase CLI z komputera właściciela (`db dump`, `link`, `migration repair`, `db push`), SQL danych startowych i ról uruchamiany w SQL Editor dashboardu | Standardowa ścieżka migracji Supabase; nie wymaga sekretów na serwerze ani w CI |
| Alternatywa | Wgranie migracji przez SQL Editor bez CLI | Prostsze, ale bez historii migracji; kolejne wdrożenia nie wiedziałyby, co jest zastosowane |

## Hosting

Bez zmian w `konfiguracja.md`: Vercel + Supabase Cloud (UE). Projekt Supabase: istniejący
vwnvbhiuundeunyzhdxj (eu-central-1), plan darmowy (odpowiedź 2).

## Design

Nie dotyczy: brak zmian ekranów.

## Kroki ręczne właściciela

- Kopia zapasowa schematu i danych przed zmianą.
- Połączenie CLI z projektem, oznaczenie migracji bazowej, wgranie migracji M2.
- Wgranie danych startowych.
- Ustawienia logowania w dashboardzie, zaproszenie 2 osób, nadanie ról skryptem.

## Ryzyka

| Obszar | Ocena (tak, nie, do ustalenia) | Skutek |
|---|---|---|
| Auth i RLS, role użytkowników | tak | ADR w 04-plan: wdrożenie ADR-003 i ról w produkcji. Wiadomo: migracja M2 sprawdzona lokalnie i w CI. Plan rozstrzyga: test uprawnień na produkcji (anon, editor, bez roli) tylko do odczytu |
| Płatności | nie | Brak |
| Dane osobowe | tak | ADR w 04-plan: dane kont redakcji (e-maile) tylko w auth Supabase; skrypty ról bez e-maili w repo (parametr przy uruchomieniu) |
| AI przetwarzające dane użytkowników | nie | Brak |
| Migracje bazy produkcyjnej | tak | ADR w 04-plan: przyjęcie istniejącej bazy (migration repair) i wdrożenie M2. Wiadomo: schemat 1:1 z migracją bazową (ADR-001), baza bez treści. Plan rozstrzyga: sprawdzenie zgodności przed `repair`, kopia, rollback, wpływ na Lovable |
| Upload plików, integracje zewnętrzne | nie | Brak |
| Płatne usługi, sekrety, nowe konta | tak | ADR w 04-plan: hasło bazy tylko u właściciela (CLI pyta interaktywnie), bez zapisu w repo; plan darmowy (usypianie po 7 dniach, brak kopii automatycznych) jako znane ryzyko |

## Szacunek poglądowy

| Miara | Wartość |
|---|---|
| Zadania | 2–3 (skrypty i instrukcja wdrożenia bazy; dokumentacja wydania) |
| Czas kalendarzowy | 1 dzień |
| Czas właściciela | ok. 1 godzina (wykonanie instrukcji, zaproszenia, sprawdzenie) |

## Tryb procesu

Tryb M: zmiana bazy produkcyjnej, uprawnień i kont to obszary ryzyka. Zlecono 2026-11-16T10:40Z (UTC).

## Do potwierdzenia

| Nr | Karta | Pytanie albo założenie | Proponowana odpowiedź | Źródło (zdecyduj sam, luka bez pytania) |
|---|---|---|---|---|
| Z1 | W-17 | Rola 2 zaproszonych osób | editor (redaktor) dla obu; właściciel admin | luka bez pytania |
| Z2 | W-16 | Status 9 szkoleń w produkcji | opublikowane, jak w repo (strona od razu ma ofertę; redakcja może wycofać w panelu) | luka bez pytania |
| Z3 | W-15 | Kopia zapasowa | `supabase db dump` schematu i danych na komputer właściciela przed zmianą | luka bez pytania |
