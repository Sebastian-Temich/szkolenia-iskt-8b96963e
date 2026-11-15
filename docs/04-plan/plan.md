# Plan: szkolenia-iskt, cykl M3-formularze-resend

Źródło: `docs/00-intake/specyfikacja.md` (cykl M3, rewizja 592d399). Wymagania W-12…W-14. Plany
poprzednich cykli: `docs/cykle/M1/04-plan/plan.md` (architektura aplikacji),
`docs/cykle/M2-bezpieczenstwo/04-plan/plan.md` (uprawnienia bazy); bez zmian poza poniższym.

## Architektura

Zmiana: pierwsza funkcja serwerowa aplikacji (wysyłka zgłoszenia przez Resend), podłączenie
wspólnego formularza zgłoszenia i nowa strona polityki prywatności. Baza, panel i Lovable bez zmian.

### Moduły i punkty wejścia

| Moduł / funkcja | Punkt wejścia (strona, trasa, komenda, endpoint) | Design (pliki) | Wymagania |
|---|---|---|---|
| Formularz zgłoszenia: sekcja kontaktu | `/` sekcja `#kontakt` (`SekcjaKontakt.tsx`, `FormularzKontaktu`), link „Kontakt” w nagłówku | istniejący formularz; stany wysyłki: brak w designie, teksty w karcie W-12 | W-12 |
| Formularz zgłoszenia: okno zapisu | `/szkolenia/$id`, przyciski „Zapisz się na szkolenie” i „Zapytaj o termin dla firmy” (`OknoZapisu.tsx`) | jak wyżej | W-12 |
| Formularz zgłoszenia: profil trenera | `/trenerzy/$id`, przycisk „Zapytaj o termin” (okno z #41) | jak wyżej | W-12 |
| Wysyłka zgłoszenia (serwer) | funkcja serwerowa `wyslijZgloszenie` (TanStack Start `createServerFn`, POST) w `src/lib/zgloszenia/` | brak (bez UI) | W-12, W-14 |
| Polityka prywatności | nowa trasa `/polityka-prywatnosci` (`src/routes/polityka-prywatnosci.tsx`), odnośnik w stopce (`Footer.tsx`), w zgodzie i informacji pod formularzem | brak w designie: prosta strona tekstowa w systemie marki (karta W-13) | W-13 |

### Model danych

Bez zmian w bazie i w `supabase/` (zgłoszeń nie zapisujemy, odpowiedź 1). Zasada migracji zgodnych
wstecz (expand/contract) obowiązuje bez zmian; ten cykl nie ma migracji. Jedyny stan po stronie
serwera to licznik limitu zgłoszeń w pamięci procesu (skróty adresów IP i znaczniki czasu, ADR-004 pkt 4).

### Integracje

Resend (`POST https://api.resend.com/emails`) z funkcji serwerowej przez `fetch`, limit czasu 10 s,
błędy mapowane na stany karty W-12 (ADR-004 pkt 2). Domena nadawcy iskt.pl zweryfikowana. W testach
atrapa `fetch` (vitest) i przechwycenie żądania funkcji serwerowej (`page.route` w Playwright); bez
prawdziwej wysyłki w CI.

### Bezpieczeństwo

- Auth: bez zmian; formularz jest anonimowy.
- Dostęp do danych: brak nowych danych w bazie.
- Sekrety: `RESEND_API_KEY` oraz `ZGLOSZENIA_ODBIORCA` i `ZGLOSZENIA_NADAWCA` jako zmienne serwerowe
  bez `VITE_`; nazwy w `.env.example`, wartości tylko w `.env.local` właściciela (ADR-004 pkt 3).
- Dane osobowe: tylko w e-mailu do biura; brak zapisu; logi z białą listą pól; escapowanie treści i
  tematu; informacja o przetwarzaniu i polityka prywatności (W-13, W-14, ADR-004 pkt 5).
- Nadużycia: pole-pułapka i limit 5 zgłoszeń na 10 minut (ADR-004 pkt 4).

### Środowiska i droga na produkcję

Lokalnie: `pnpm dev` z `.env.local` właściciela (prawdziwa wysyłka tylko u właściciela, W-12/K10).
CI: bez klucza, testy z atrapą. Lovable: bez klucza i bez publikacji (stan błędu, gdyby ktoś wysłał).
Produkcja na Vercel ze zmiennymi i trwałym limitem: zlecenie 6.

### Decyzje

- [ADR-004: Wysyłka zgłoszeń przez Resend z serwera aplikacji, sekrety i dane osobowe](adr/ADR-004-wysylka-zgloszen-resend-i-dane-osobowe.md)
- Bez zmian: ADR-001 (baza z migracji), ADR-002 (pnpm), ADR-003 (uprawnienia funkcji ról).

## Kamienie milowe

| Nr | Kamień milowy | Rezultat | Wymagania | Warunek startu |
|---|---|---|---|---|
| M3 | Wysyłka zgłoszeń | Formularz we wszystkich czterech miejscach wysyła zgłoszenie do biura przez Resend ze stanami i ochroną przed spamem; polityka prywatności z odnośnikami; logi bez danych osobowych; dokumentacja wydania M3; CI zielone | W-12, W-13, W-14 | Plan zaakceptowany; lista startowa kompletna (plan Resend potwierdzony, treść polityki zaakceptowana przed zadaniem W-13) |

Kamień M3 kontynuuje numerację projektu (M1, M2 w archiwum cykli). Szkielet projektu (narzędzia,
CI, baza z migracji, E2E, responsywność z #37) już istnieje, więc cykl zmiany nie ma zadania
szkieletu: pierwsze zadanie korzysta z istniejącego. Zadania (rozpisuje 06-zadania, ID od T9):

1. Wysyłka zgłoszenia (W-12, W-14): moduł `src/lib/zgloszenia/` i podłączenie `FormularzKontaktu` we
   wszystkich miejscach, stany, pułapka, limit, testy jednostkowe i E2E, `.env.example`, README.
2. Polityka prywatności (W-13): trasa, treść w module treści, odnośniki w stopce i formularzu, testy.
   Zależy od 1 (wspólny `FormularzKontaktu`) i od akceptacji treści przez właściciela.
3. Dokumentacja wydania M3 (`docs/wydanie/techniczna/M3.md`, `produktowa/M3.md`): zmienne, test
   ręczny właściciela, ograniczenie limitu do zlecenia 6. Zależy od 1 i 2.

## Zadania właściciela

| Zadanie | Przed | Uwagi |
|---|---|---|
| Potwierdzić plan Resend (limity wysyłki) | dispatch T9 | lista startowa |
| Zaakceptować szkic polityki prywatności i klauzuli (przygotuje orkiestrator) | dispatch zadania W-13 | lista startowa; treść trafia do celu zadania |
| Test wysyłki na skrzynce biuro@iskt.pl (`pnpm dev` z `.env.local`) | odbiorem M3 | W-12/K10, scenariusz O-17 |
| Konta prod, Vercel, zmienne prod (nowy klucz Resend, adresy), DNS, staging, `STAGING_DB_URL` | zleceniem 6 | nie dotyczy M3 |

## Ryzyka

| Ryzyko | Skutek | Działanie (ADR, spike, dowody) | Właściciel |
|---|---|---|---|
| Funkcja serwerowa nie działa w buildzie nitro `cloudflare-module` (np. `process.env`) | Wysyłka działa w `pnpm dev`, ale nie po buildzie | ADR-004 pkt 7: `pnpm build` w kryteriach T9; odczyt zmiennych w jednej warstwie; ewentualna różnica opisana w raporcie i przekazana do zlecenia 6 | worker T9 |
| Dane osobowe w logach albo w błędach | Naruszenie RODO | ADR-004 pkt 5: biała lista pól loggera, test W-12/K9 | worker T9, review |
| Wstrzyknięcie HTML lub nagłówków w e-mailu | Podrobione treści do biura | Escapowanie i temat bez nowej linii, test W-12/K7 | worker T9 |
| Klucz z `.env.local` w worktree workera | Przypadkowa prawdziwa wysyłka z testów | ADR-004 pkt 3: konfiguracja jako parametr, atrapa w testach, brak wysyłki z `pnpm dev` u workera | worker T9, review |
| Limit zgłoszeń per instancja na hostingu bezserwerowym | Słabsza ochrona przed spamem po wdrożeniu | ADR-004 pkt 4: znane ograniczenie, trwały licznik w zleceniu 6 | orkiestrator (zlecenie 6) |
| Treść polityki bez akceptacji | Brak podstawy dla zgody | Zadanie W-13 czeka na akceptację właściciela | właściciel |

## Scenariusze odbioru

| Nr | Scenariusz | Kroki | Oczekiwany wynik | Wymagania | Kamień |
|---|---|---|---|---|---|
| O-17 | Prawdziwa wysyłka (ręcznie, właściciel) | `pnpm dev` z `.env.local`; zgłoszenie z sekcji kontaktu i z okna „Zapisz się” | Dwa e-maile na biuro@iskt.pl: nadawca formularz@iskt.pl, tematy „[Kontakt] …” i „[Zapis] …”, wszystkie pola, „Odpowiedz” do zgłaszającego | W-12 | M3 |
| O-18 | Walidacja | Wyślij formularz z pustymi polami i złym e-mailem | Komunikaty przy polach, fokus na pierwszym błędzie, brak wysyłki | W-12 | M3 |
| O-19 | Błąd usługi | E2E z udawaną odpowiedzią błędu funkcji serwerowej | Komunikat z szkolenia@iskt.pl, dane zostają w polach | W-12 | M3 |
| O-20 | Okno firmy i profil trenera | E2E: „Zapytaj o termin dla firmy” na `/szkolenia/genai` i „Zapytaj o termin” na profilu trenera | Żądanie z `zrodlo` = firma, „Dziękujemy!” | W-12 | M3 |
| O-21 | Spam | Test serwera: pułapka wypełniona; 6 zgłoszeń w 10 min | Pułapka: sukces bez wysyłki; szóste: komunikat o zbyt wielu próbach | W-12 | M3 |
| O-22 | Polityka prywatności | Stopka → „Polityka prywatności”; odnośnik w zgodzie w oknie | Strona z treścią zaakceptowaną przez właściciela; w oknie nowa karta | W-13 | M3 |
| O-23 | Logi bez danych osobowych | Test serwera dla sukcesu, błędu i odrzucenia | Logi bez imienia, e-maila, telefonu i treści | W-14 | M3 |
| O-24 | Regresja | CI na `main`: `jakosc`, `e2e` (z responsywnością i dostępnością) | Zielone | W-12, W-13 | M3 |

## Zakres autoryzacji

Po akceptacji orkiestrator zapisuje go w `decyzje.md` przez `shctl decision add --rola wlasciciel`.

- Na co: kamień M3 (zadania z `06-zadania`, ID od T9).
- Zakres: W-12…W-14; nowy moduł serwerowy `src/lib/zgloszenia/`, zmiany w formularzu, stopce i nowa
  trasa polityki; testy; `.env.example` i README; bez zmian w `supabase/`, w chmurze, w Lovable i Vercel;
  bez nowych płatnych usług (Resend w planie potwierdzonym przez właściciela).
- Do kiedy: do odbioru M3.
- Wymaga nowej decyzji właściciela: zapis zgłoszeń w bazie lub CRM, e-mail do zgłaszającego, CAPTCHA,
  zmiana odbiorcy na szkolenia@iskt.pl, publikacja, nowa zależność płatna.

## Gotowość środowiska

`shctl doctor --json` 2026-11-15T15:06Z: 0 błędów; uwagi: Obsidian szkolenia-iskt różni się od
origin (widok, bez wpływu na pracę), repo sh-test-adopt do usunięcia (inny projekt). Docker działa,
wolne 28 GB. Lista startowa M3: domena, adresy i klucz w `.env.local` potwierdzone; otwarte: plan
Resend i treść polityki (zadania właściciela).

## Następny krok

Orkiestrator: review etapu 04-plan, potem akceptacja właściciela.
