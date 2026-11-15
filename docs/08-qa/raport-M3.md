# Raport QA: M3 Wysyłka zgłoszeń

Data: 2026-11-15T19:38Z
Commit: dd40566

## Zakres

Kamień M3 „Wysyłka zgłoszeń” (cykl M3-formularze-resend, `docs/04-plan/plan.md`), wymagania
W-12…W-14 (`docs/00-intake/specyfikacja.md`), karty W-12 i W-13, ADR-004.

Zamknięte issue kamienia:

- #46 Wysyłka zgłoszenia z formularza przez Resend (PR #49, 2 iteracje, eskalacja E-001: dodatkowa naprawa CI za zgodą właściciela)
- #47 Polityka prywatności i informacja o danych przy formularzu (PR #50)
- #48 Dokumentacja wydania M3 (PR #51)

Pominięte („not planned”): brak.

Przepływy: formularz w czterech miejscach (`/#kontakt`, okno „Zapisz się” i „Zapytaj o termin dla
firmy” na `/szkolenia/$id`, okno z profilu `/trenerzy/$id`) → funkcja serwerowa → Resend (atrapa);
zgoda w formularzu → polityka prywatności (nowa karta w oknie) → powrót i wysyłka bez utraty danych
(nowy test QA). Scenariusze odbioru O-17…O-24 z planu; O-17 (prawdziwa wysyłka na skrzynkę) to test
ręczny właściciela przy odbiorze.

## Wyniki testów

| Obszar | Wynik | Uwagi |
|---|---|---|
| E2E chromium | pass | job `e2e` na PR #52 (run 43753779473): 186/186 dla obu przeglądarek (93 testy na przeglądarkę), bez `test.fixme`; komenda `pnpm exec playwright test --project=chromium --project=webkit` |
| E2E webkit | pass | jak wyżej, ten sam job |
| Integracja | pass | testy serwera z atrapą `fetch` (`src/test/zgloszenia-serwer.test.ts`): sukces, błąd 500, przekroczenie czasu (także odczyt treści po 200), brak konfiguracji, pułapka, limit 5/10 min, zmieniany `x-forwarded-for`, limit globalny 50/h, logi bez danych osobowych |
| Testy jednostkowe | pass | vitest 30 plików, 339 testów (job `jakosc`, ten sam run) |
| Testy QA (`e2e/qa/`) | pass | `e2e/qa/M3-polityka-i-wysylka.spec.ts`: przepływ okno zapisu → polityka w nowej karcie → powrót z danymi → „Dziękujemy!”, chromium i webkit |
| Lighthouse / qa-staging | nie dotyczy | brak `staging_url` (job tylko odnotowuje) |
| Sekrety | pass | gitleaks w CI zielone na PR #49–#52; klucz Resend tylko w `.env.local` właściciela, w repo nazwy zmiennych bez wartości (`.env.example`) |

Niestabilne testy: brak. Pierwszy przebieg CI tego PR padł na formatowaniu nowego testu QA
(`jakosc`, prettier); poprawione w commicie 7de910f, aplikacja bez zmian.

## Zgodność z wymaganiami

| Wymaganie | Wynik | Dowód |
|---|---|---|
| W-12 wysyłka zgłoszenia | spełnione (z testem ręcznym O-17 przy odbiorze) | e2e `zgloszenia.spec.ts`: K8 cztery miejsca ze źródłem `kontakt`/`zapis`/`firma`, K2 i K6 walidacja i blokada podwójnej wysyłki, K3 i K5 błąd i limit, formularz bez JS bez danych w URL; testy serwera K1, K4, K7 (temat, `reply_to`, escapowanie); obszar z kategorii w oknie (Z1); O-18…O-21 |
| W-13 informacja o danych i polityka | spełnione (dane firmy „[do uzupełnienia]” do odbioru) | e2e `polityka-prywatnosci.spec.ts` (K1, stopka), test jednostkowy `polityka-prywatnosci.test.tsx` (K2, nowa karta w oknie), `responsywnosc.spec.ts` i `dostepnosc.spec.ts` (K3), test QA M3 (przepływ z okna); treść zgodna ze szkicem zaakceptowanym 2026-11-15 (K4); O-22 |
| W-14 logi i dane osobowe | spełnione | test serwera: wpisy logu dla sukcesu, błędu i odrzucenia bez imienia, e-maila, telefonu i treści; moduł `src/lib/zgloszenia/` bez klienta Supabase; O-23 |

## Zgłoszenia

Tylko 🔴 krytyczne i 🟡 istotne; każde staje się issue `typ:qa` przez `shctl task create`.
Przyczyna: `wymaganie` (luka lub sprzeczność w specyfikacji albo karcie), `kod`, `test` (brak albo zły
test), `design` (brak lub niespójność designu).

| Issue | Waga | Przyczyna | Opis |
|---|---|---|---|
| brak | | | |

## Drobne uwagi

Zgłoszenia ⚪ drobne, bez issue; orkiestrator przenosi je do `docs/backlog-drobne.md`. Każda pozycja
zaczyna się od przyczyny, np. `- (przyczyna: design) odstęp nagłówka`.

- (przyczyna: wymaganie) Polityka prywatności pokazuje dane firmy (adres siedziby, KRS, NIP) jako
  „[do uzupełnienia]”; właściciel podaje je przed odbiorem M3 albo przed publikacją (zlecenie 6),
  zmiana tylko w module treści `src/lib/polityka/`.
- (przyczyna: test) Prawdziwa wysyłka przez Resend (W-12/K10, O-17) jest sprawdzalna tylko ręcznie
  przez właściciela z kluczem; CI sprawdza wyłącznie atrapę.

## Przyczyny

Liczba zgłoszeń wszystkich wag; orkiestrator przepisuje ten wiersz do „Przyczyn uwag” w `docs/metryki.md`.

| Źródło | Wymaganie | Kod | Test | Design | Bez przyczyny |
|---|---|---|---|---|---|
| QA M3 | 1 | 0 | 1 | 0 | 0 |

## Werdykt

PASS: W-12…W-14 spełnione z dowodem w testach i CI (186/186 E2E, 339 testów jednostkowych), brak
zgłoszeń krytycznych i istotnych; prawdziwa wysyłka na skrzynkę zostaje dla testu właściciela (O-17).
