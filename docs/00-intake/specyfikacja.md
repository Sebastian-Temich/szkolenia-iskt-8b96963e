# Specyfikacja: M3 Wysyłka formularzy przez Resend

Zlecenie: `docs/00-intake/zrodlo.md`. Zlecono (UTC): 2026-11-14T20:14Z.

## Cel i kontekst

Problem: formularz zgłoszenia (sekcja „Zgłoszenie” na stronie głównej, okno „Zapisz się na
szkolenie” i „Zapytaj o termin dla firmy” na stronie szkolenia, okno z profilu trenera) ma wyłączony
przycisk „Wyślij zgłoszenie”, więc zainteresowani nie mogą się zapisać ani zapytać o termin przez
stronę. Dla kogo: osoby indywidualne i firmy szukające szkoleń ISKT oraz biuro ISKT, które obsługuje
zgłoszenia. Rezultat biznesowy: każde zgłoszenie z formularza trafia e-mailem do biura ze wszystkimi
danymi potrzebnymi do odpowiedzi, a osoba zgłaszająca wie, czy wysyłka się udała.

Sytuacja wyjściowa (stan obecny): karty F-02 i F-04 w `docs/00-analiza/funkcje/`, okno zapisu z #18
(`docs/cykle/M1/`), profil trenera z #41, responsywność z #37. Poprzednie cykle: specyfikacje w
`docs/cykle/M1/00-intake/` i `docs/cykle/M2-bezpieczenstwo/00-intake/`. Formularz to jeden wspólny
komponent, więc podłączenie działa we wszystkich miejscach naraz. Domena iskt.pl jest zweryfikowana
w Resend, a klucz do pracy lokalnej ma właściciel (decyzje.md 2026-11-14).

## Użytkownicy

| Grupa | Potrzeba | Uprawnienia |
|---|---|---|
| Osoba indywidualna | Zapisać się na szkolenie albo zapytać o nie bez dzwonienia | Anonimowy odwiedzający, wysyła formularz |
| Firma (osoba w imieniu firmy) | Zapytać o termin i szkolenie zamknięte dla zespołu | Anonimowy odwiedzający, wysyła formularz |
| Biuro ISKT | Dostać komplet danych zgłoszenia i odpowiedzieć jednym kliknięciem | Odbiorca e-maili (poza aplikacją) |

## Zakres

W zakresie:

- Wysyłka zgłoszenia e-mailem przez Resend z serwera aplikacji ze wszystkich miejsc formularza (W-12).
- Walidacja wszystkich pól (wszystkie wymagane), stany „Wysyłam…”, sukces, błąd i limit (W-12).
- Ochrona przed spamem: pole-pułapka i limit zgłoszeń (W-12).
- Informacja o przetwarzaniu danych przy formularzu, strona polityki prywatności i odnośnik w stopce
  (W-13).
- Testy z atrapą Resend (bez prawdziwej wysyłki w CI) i ręczny test właściciela na skrzynce.

Poza zakresem:

- Wysyłka na produkcji (Lovable): klucz trafi do Vercel w zleceniu 6 (decyzja 2026-11-14).
- Zapis zgłoszeń w bazie, lista zgłoszeń w panelu i CRM (odpowiedź 1: później).
- E-mail z potwierdzeniem do osoby zgłaszającej (odpowiedź 3).
- CAPTCHA (Cloudflare Turnstile), nowe pola, załączniki.
- Zmiana adresu kontaktowego na stronie i odbiorcy na szkolenia@iskt.pl (odpowiedź 7: później,
  samą zmienną).
- Regulamin, baner cookie.

## Wymagania

### W-12: Wysyłka zgłoszenia z formularza do biura (musi)

Jako osoba zainteresowana szkoleniem chcę wysłać zgłoszenie z formularza na stronie, aby biuro ISKT
skontaktowało się ze mną w sprawie szkolenia.

- Given formularz z poprawnymi danymi we wszystkich polach, when użytkownik klika „Wyślij
  zgłoszenie”, then biuro dostaje e-mail ze wszystkimi wpisanymi informacjami, a użytkownik widzi
  „Dziękujemy!”.
- Given puste albo błędne pole, when użytkownik klika „Wyślij zgłoszenie”, then widzi komunikat przy
  polu i nic nie jest wysyłane.
- Given usługa poczty nie działa, when użytkownik wysyła zgłoszenie, then widzi komunikat błędu z
  adresem szkolenia@iskt.pl, a wpisane dane zostają.
- Given 5 zgłoszeń z jednego adresu w 10 minut, when przychodzi szóste, then jest odrzucone z
  komunikatem o zbyt wielu próbach.

### W-13: Informacja o danych przy formularzu i strona polityki prywatności (musi)

Jako osoba wysyłająca zgłoszenie chcę wiedzieć, kto i po co przetwarza moje dane, aby świadomie
wyrazić zgodę.

- Given formularz zgłoszenia, when użytkownik czyta zgodę, then widzi informację o administratorze i
  odnośnik „Polityka prywatności” do strony polityki.
- Given dowolna strona serwisu, when użytkownik klika „Polityka prywatności” w stopce, then widzi
  stronę polityki z treścią zaakceptowaną przez właściciela.

### W-14: Logi i dane osobowe w wysyłce (musi) (bez karty: wymaganie niefunkcjonalne, szczegóły w W-12)

Jako właściciel chcę, aby dane osobowe ze zgłoszeń nie trafiały do logów ani bazy, aby nie
przechowywać ich bez potrzeby.

- Given wysyłka zgłoszenia (udana, odrzucona albo z błędem), when serwer zapisuje logi, then logi nie
  zawierają imienia, e-maila, telefonu ani treści wiadomości.
- Given dowolne zgłoszenie, when zostało obsłużone, then nie ma go w bazie danych aplikacji.

## Karty funkcji

| Wymaganie | Karta | Rodzaj (pelna, skrocona) | Ekrany z designu |
|---|---|---|---|
| W-12 | `funkcje/W-12.md` | pelna | Istniejący formularz (`SekcjaKontakt.tsx`, `OknoZapisu.tsx`); stany wysyłki: brak w designie, teksty w karcie |
| W-13 | `funkcje/W-13.md` | skrocona | Stopka i formularz istniejące; strona polityki: brak w designie, prosta strona tekstowa w systemie marki |

## Lista startowa

Rzeczy zewnętrzne od właściciela (konta, dostępy, domeny, klucze testowe, materiały):
`docs/00-intake/lista-startowa.md`. Realizacja nie startuje, dopóki lista nie jest kompletna.

## Typ projektu

Web (bez zmian względem M1 i M2): publiczny serwis oferty szkoleń z panelem redakcyjnym.

| Konsekwencja | Ustalenie |
|---|---|
| Narzędzia testowe | Vitest (walidacja, budowa e-maila, funkcja serwerowa z atrapą Resend), Playwright chromium i webkit (formularz we wszystkich miejscach, wysyłka z atrapą po stronie serwera, axe, 360 px) |
| Dodatkowe punkty DoD | Brak prawdziwej wysyłki w CI i testach; brak danych osobowych w logach (W-14); klucz tylko w `.env.local` |
| Ograniczenia runnera | Worker nie ma sieci do api.resend.com ani klucza (sandbox, `.env.local` niedostępny dla odczytu); prawdziwą wysyłkę sprawdza właściciel ręcznie (W-12/K10) |
| Kroki ręczne właściciela | Klucz Resend w `.env.local`, potwierdzenie planu Resend, akceptacja treści polityki, test wysyłki na skrzynce |

## Stack

| | Wybór | Uzasadnienie |
|---|---|---|
| Rekomendacja | Funkcja serwerowa TanStack Start (`createServerFn`) wywołująca API Resend (`fetch` albo SDK `resend`), walidacja zod 4 wspólna dla przeglądarki i serwera, react-hook-form w formularzu | Zostaje w kontrakcie stacku (TanStack Start z SSR, zod); klucz nie opuszcza serwera; działa na obecnym serwerze nitro i na Vercel po zleceniu 6 |
| Alternatywa | Supabase Edge Function wywołująca Resend | Odrzucona na start: wymaga wdrożenia funkcji i sekretów w projekcie Supabase w chmurze, którego nie zmieniamy (decyzje.md 2026-11-12), i działa dopiero po zleceniu 6 |

Wybór szczegółów (SDK czy `fetch`, miejsce limitu zgłoszeń) rozstrzyga ADR w 04-plan.

## Hosting

Bez zmian: `docs/konfiguracja.md` (`hosting`: Vercel + Supabase Cloud UE na kontach klienta,
zaakceptowany). W tym cyklu wysyłka działa lokalnie; produkcja na Lovable bez klucza i bez publikacji
(decyzje.md 2026-11-12), wdrożenie na Vercel w zleceniu 6.

## Design

Design: istniejący formularz i system marki w `src/styles.css` (bez zmian). Stany wysyłki (W-12) i
strona polityki (W-13) nie mają makiet: teksty i układ są w kartach, wygląd z tokenów marki. Właściciel
nie musi nic dostarczać do `docs/00-intake/zrodla/` poza akceptacją treści polityki (lista startowa).

## Kroki ręczne właściciela

- Wpisać klucz Resend do `.env.local` (lista startowa).
- Potwierdzić, że plan Resend wystarcza (lista startowa).
- Zaakceptować szkic polityki prywatności i klauzuli (lista startowa).
- Wysłać testowe zgłoszenie lokalnie i sprawdzić e-mail w skrzynce biuro@iskt.pl (W-12/K10, odbiór).

## Ryzyka

| Obszar | Ocena (tak, nie, do ustalenia) | Skutek |
|---|---|---|
| Auth i RLS, role użytkowników | nie | Formularz anonimowy, bez bazy i bez zmian RLS |
| Płatności | nie | Brak |
| Dane osobowe | tak | Minimum M. ADR w 04-plan: dane osobowe w zgłoszeniach. Wiadomo: imię i nazwisko, e-mail, telefon, treść; bez zapisu w bazie (odpowiedź 1); kopia tylko w skrzynce biura i w Resend. Plan rozstrzyga: logi bez danych (W-14), escapowanie, informacja o przetwarzaniu (W-13), okres przechowywania podany w polityce |
| AI przetwarzające dane użytkowników | nie | Brak |
| Migracje bazy produkcyjnej | nie | Brak zmian w `supabase/` |
| Upload plików, integracje zewnętrzne | tak | ADR w 04-plan: integracja Resend. Wiadomo: domena iskt.pl zweryfikowana, klucz po stronie serwera. Plan rozstrzyga: limit czasu (10 s), obsługa błędów, limit zgłoszeń przy hostingu bezserwerowym (pamięć procesu czy trwały licznik), atrapa Resend w testach |
| Płatne usługi, sekrety, nowe konta | tak | ADR w 04-plan: integracja Resend (ten sam ADR co integracje zewnętrzne), część „Sekrety i limity usługi”. Wiadomo: klucz Resend tylko w `.env.local` właściciela (decyzja 2026-11-14), w produkcji nowy klucz w Vercel (zlecenie 6); plan Resend potwierdza właściciel na liście startowej. Plan rozstrzyga: nazwy zmiennych serwerowych i ich wpis w `.env.example` bez wartości, zachowanie bez klucza (stan błędu W-12), brak klucza w CI (atrapa), zachowanie przy wyczerpaniu limitu planu Resend. Krok ręczny właściciela: klucz i plan |

## Szacunek poglądowy

| Miara | Wartość |
|---|---|
| Zadania | 3–4 (wysyłka z serwera i formularz; polityka prywatności; dokumentacja wydania) |
| Czas kalendarzowy | 1–2 dni |
| Czas właściciela | ok. 1 godzina (lista startowa, akceptacje, test na skrzynce) |

## Tryb procesu

Tryb M: zlecenie wprowadza dane osobowe, integrację z zewnętrzną usługą i sekret, czyli obszary
ryzyka. Zlecono 2026-11-14T20:14Z (UTC).

## Do potwierdzenia

Zbiorcza lista z sekcji „Do potwierdzenia” wszystkich kart i założeń specyfikacji. Checkpoint
specyfikacji pokazuje właścicielowi części „Dla właściciela” kart i tę listę.

| Nr | Karta | Pytanie albo założenie | Proponowana odpowiedź | Źródło (zdecyduj sam, luka bez pytania) |
|---|---|---|---|---|
| Z1 | W-12 | Pole „Szkolenie” i „Interesujące szkolenie / obszar” w oknie są oba wymagane | Oba wymagane; w oknie obszar wybrany z góry według kategorii szkolenia | luka bez pytania |
| Z2 | W-12 | Czas odpowiedzi w podziękowaniu | „Odezwiemy się w ciągu 2 dni roboczych.” | luka bez pytania |
| Z3 | W-12 | Limity długości pól | Imię i nazwisko do 120 znaków, e-mail do 254, telefon 9–20 znaków, wiadomość 10–2000 znaków | luka bez pytania |
| Z4 | W-13 | Adres strony polityki | /polityka-prywatnosci | luka bez pytania |
| Z5 | W-13 | Zakres szkicu polityki | Administrator, cel i podstawa, odbiorcy (Resend, hosting), okres (do końca korespondencji, najdłużej 12 miesięcy), prawa, skarga do UODO, brak profilowania | luka bez pytania |
