# ADR-004: Wysyłka zgłoszeń przez Resend z serwera aplikacji, sekrety i dane osobowe

Status: proponowana
Data: 2026-11-15

## Kontekst

Cykl M3 (`docs/00-intake/specyfikacja.md`, W-12…W-14) podłącza wspólny formularz zgłoszenia
(`FormularzKontaktu` w `src/components/strona-glowna/SekcjaKontakt.tsx`, używany też przez
`OknoZapisu.tsx` i profil trenera) do wysyłki e-mailem przez Resend. Obszary ryzyka na „tak”: dane
osobowe, integracja zewnętrzna, sekrety (specyfikacja, „Ryzyka”). Aplikacja nie ma dziś żadnej funkcji
serwerowej ani zmiennych serwerowych; build to TanStack Start z nitro (`cloudflare-module`, ADR do
zmiany w zleceniu 6), lokalnie `pnpm dev`. Produkcja na Lovable zostaje bez klucza i bez publikacji
(decyzje.md 2026-11-12, 2026-11-14). Zgłoszeń nie zapisujemy w bazie (odpowiedź 1).

## Decyzja

1. **Funkcja serwerowa TanStack Start.** Jeden moduł serwerowy `src/lib/zgloszenia/` z
   `createServerFn({ method: "POST" })` (`wyslijZgloszenie`) wołany z `FormularzKontaktu`. Logika w
   czystych funkcjach testowalnych bez serwera: `schemat.ts` (zod 4, wspólny dla przeglądarki i
   serwera, serwer rozstrzyga), `email.ts` (temat R4, treść tekstowa i HTML z escapowaniem, temat bez
   znaków nowej linii), `limit.ts` (limit zgłoszeń), `resend.ts` (wywołanie API), `log.ts` (logi z
   białą listą pól). Klucz i adresy czyta wyłącznie kod serwerowy.
2. **Resend przez `fetch`, bez SDK.** `POST https://api.resend.com/emails` z nagłówkiem
   `Authorization: Bearer RESEND_API_KEY`, polami `from`, `to`, `reply_to` (e-mail zgłaszającego),
   `subject`, `text`, `html`; limit czasu 10 s (`AbortSignal.timeout(10_000)`). Odpowiedź inna niż 2xx,
   przekroczenie czasu albo błąd sieci daje wynik „błąd usługi” (stan „Błąd po naszej stronie”, kod 502).
   Bez nowej zależności; adres API stały w kodzie, w testach atrapa `fetch`.
3. **Sekrety i ustawienia (zmienne serwerowe, bez przedrostka `VITE_`).** `RESEND_API_KEY` (sekret),
   `ZGLOSZENIA_ODBIORCA` (teraz biuro@iskt.pl), `ZGLOSZENIA_NADAWCA` (`Szkolenia ISKT
   <formularz@iskt.pl>`), opcjonalnie `ZGLOSZENIA_NAGLOWEK_IP` (pkt 4, pusta lokalnie). Nazwy w `.env.example` bez wartości. Wartości lokalnie tylko w `.env.local`
   właściciela (decyzje.md 2026-11-14); w produkcji w Vercel (zlecenie 6, nowy klucz). Brak którejś
   zmiennej: wynik „konfiguracja” (kod 503, stan „Błąd po naszej stronie”), bez wywołania Resend. W CI
   i u workera klucza nie ma: testy używają atrapy, a prawdziwą wysyłkę sprawdza właściciel (W-12/K10).
   Wyczerpany limit planu Resend (odpowiedź 429 od Resend) to ten sam stan błędu usługi z logiem
   `powod=resend status=429`. `shctl task dispatch` kopiuje `.env.local` do worktree workera, więc
   plik z kluczem tam jest, choć worker nie może go czytać (hook `.env*`), a specyfikacja („Typ
   projektu”) mówi w tym sensie, że worker nie ma klucza. Klucz może jednak wczytać proces aplikacji
   uruchomiony w worktree, dlatego handler dostaje konfigurację jako parametr (odczyt `process.env` tylko w
   cienkiej warstwie funkcji serwerowej), testy przekazują konfigurację testową i atrapę `fetch`, a
   worker nie wysyła zgłoszeń z `pnpm dev`. Żaden test ani przebieg CI nie wysyła prawdziwego e-maila.
4. **Ochrona przed spamem.** Pole-pułapka o neutralnej nazwie (np. `strona_www`), ukryte wizualnie i
   przed czytnikami; wypełnione → udawany sukces bez wysyłki. Limit 5 zgłoszeń na 10 minut na adres IP
   klienta, liczony w pamięci procesu (mapa skrót adresu → znaczniki czasu, okno przesuwne,
   czyszczenie starych wpisów). Klucz mapy to skrót SHA-256 adresu, a adres nie trafia do logów.
   **Źródło adresu nie pochodzi od klienta:** nagłówka `x-forwarded-for` (i innych ustawianych przez
   klienta) nie czytamy. Domyślnie adres połączenia (gniazdo; lokalnie `pnpm dev`). Za zaufanym proxy
   adres bierzemy wyłącznie z nagłówka platformy wskazanego zmienną serwerową
   `ZGLOSZENIA_NAGLOWEK_IP` (np. `x-vercel-forwarded-for` na Vercel, `cf-connecting-ip` na Cloudflare),
   który platforma nadpisuje; ustawia ją zlecenie 6 razem z hostingiem. Brak adresu: wspólny klucz
   „nieznany” (limit działa zbiorczo). **Limit globalny:** dodatkowo najwyżej 50 wysyłek na godzinę na
   instancję, po przekroczeniu stan „Za dużo prób”; chroni plan Resend (100 e-maili dziennie) przed
   wyczerpaniem nawet przy rozproszonych adresach. Testy: podrobiony `x-forwarded-for` zmieniany w
   każdym żądaniu nie zeruje limitu; nagłówek platformy jest czytany tylko przy ustawionej zmiennej;
   limit globalny odcina 51. wysyłkę w godzinie. Ograniczenie: na hostingu bezserwerowym liczniki są
   per instancja, więc limity są przybliżone; trwały licznik (np. tabela w Supabase albo magazyn KV)
   rozstrzyga zlecenie 6 razem z hostingiem.
5. **Dane osobowe.** Imię i nazwisko, e-mail, telefon i treść wiadomości trafiają tylko do e-maila
   przez Resend; aplikacja ich nie zapisuje (bez bazy, bez plików, bez pamięci poza czasem żądania;
   limit trzyma skróty adresów IP i znaczniki czasu, bez danych formularza). Logi (`log.ts`) przyjmują
   wyłącznie pola z białej listy: `zrodlo`, `powod`, `status`, `id_resend`, nazwy błędnych pól; test
   sprawdza, że wywołania loggera nie zawierają wartości z formularza (W-14). Okres przechowywania w
   skrzynce biura i u dostawcy opisuje polityka prywatności (W-13), akceptowana przez właściciela.
6. **Testy.** Vitest: schemat (każde pole, wartości graniczne), budowa e-maila (temat R4 dla
   `kontakt`, `zapis`, `firma`, escapowanie), limit (5 przejść, 6. odmowa, okno 10 min z kontrolą
   czasu, podrobiony `x-forwarded-for` bez wpływu, nagłówek platformy tylko przy
   `ZGLOSZENIA_NAGLOWEK_IP`, limit globalny 50/h), handler serwerowy z atrapą `fetch` (sukces, błąd, przekroczenie czasu, brak konfiguracji,
   pułapka, logi bez danych osobowych). Playwright (chromium, webkit): formularz w czterech miejscach,
   walidacja, stany; żądanie do funkcji serwerowej przechwycone przez `page.route` (sprawdzenie
   `zrodlo` i pól, odpowiedź udawana: sukces, błąd, limit), bez prawdziwej wysyłki.
7. **Bez zmian:** baza i `supabase/`, Lovable (bez publikacji), konfiguracja builda (nitro zostaje do
   zlecenia 6). Worker sprawdza, że funkcja serwerowa buduje się (`pnpm build`) i działa w `pnpm dev`.

## Rozważane opcje

- **SDK `resend`:** wygodniejsze typy, ale nowa zależność i jej aktualizacje dla jednego wywołania;
  odrzucone na rzecz `fetch` (pkt 2).
- **Supabase Edge Function:** wymaga wdrożenia i sekretów w projekcie Supabase w chmurze, którego nie
  zmieniamy (decyzje.md 2026-11-12), i nie działa lokalnie bez dodatkowej konfiguracji; odrzucone.
- **Trwały limit w bazie od razu:** wymaga migracji i zapisu danych technicznych dla anonimowych
  użytkowników przed decyzją o hostingu; odłożone do zlecenia 6 (pkt 4).
- **Cloudflare Turnstile:** właściciel wybrał pułapkę i limit bez CAPTCHA (odpowiedź 4).

## Konsekwencje

- Pierwsza funkcja serwerowa w projekcie: wzorzec dla kolejnych (np. CRM w przyszłości).
- Formularz działa lokalnie z kluczem właściciela; na Lovable bez klucza pokazałby stan błędu, ale
  Lovable nie jest publikowany. Na Vercel działa po wpisaniu zmiennych (zlecenie 6, zadanie właściciela).
- Limit zgłoszeń jest przybliżony do czasu trwałego licznika (zlecenie 6).
- Cofnięcie: przywrócenie wyłączonego przycisku i usunięcie modułu `src/lib/zgloszenia/`; dane nie
  są nigdzie zapisane, więc nie ma migracji do cofnięcia.
