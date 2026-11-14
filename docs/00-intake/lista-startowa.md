# Lista startowa

Wszystko zewnętrzne, czego realizacja potrzebuje od właściciela: konta, dostępy, domeny, klucze
testowe, limity i płatności usług, materiały. Spisuje ją `sh-intake` na początku zlecenia jedną listą,
a orkiestrator zaznacza pozycję po potwierdzeniu właściciela (na `main`).

`shctl task ready` i `shctl task dispatch` nie startują realizacji, dopóki jest tu choć jedno pole
`- [ ]`. Pole bez zastosowania: `- [-] treść (nie dotyczy: powód)`.

Format pozycji: `- [ ] CO, PO CO (W-NN), JAK: kroki dla właściciela; GDZIE wpisać; JAK sprawdzimy`.

Cykl M3 wymienia tylko nowe rzeczy zewnętrzne (poprzednie: `docs/cykle/*/00-intake/lista-startowa.md`).

## Konta i dostępy

- [ ] Konto Resend z domeną nadawcy iskt.pl, PO CO: wysyłka zgłoszeń (W-12), JAK: domena iskt.pl
  ma w panelu Resend (Domains) status „Verified” (właściciel potwierdził 2026-11-14); GDZIE: panel
  Resend; JAK sprawdzimy: lokalna wysyłka testowego zgłoszenia dochodzi na adres odbiorcy.

## Domeny i DNS

- [-] Nowe rekordy DNS (nie dotyczy: domena iskt.pl jest już zweryfikowana w Resend; zmiana domeny
  strony to zlecenie 6)

## Klucze testowe i zmienne

- [ ] Klucz API Resend do pracy lokalnej, PO CO: wysyłka zgłoszeń z serwera aplikacji (W-12), JAK:
  właściciel sam wpisuje klucz (Resend → API Keys, uprawnienie „Sending access” dla domeny iskt.pl)
  jako `RESEND_API_KEY` w `.env.local`; nazwa bez przedrostka `VITE_`, więc klucz nie trafia do
  przeglądarki; wartość nigdy w repo, docs, issue ani logach (decyzje.md 2026-11-14); GDZIE:
  `/Users/Shared/sh/projekty/szkolenia-iskt/.env.local`; JAK sprawdzimy: wysyłka testowego zgłoszenia
  lokalnie dochodzi na biuro@iskt.pl (sprawdzenie ręczne właściciela).
- [ ] Adres odbiorcy i nadawcy, PO CO: e-mail do biura (W-12), JAK: odbiorca biuro@iskt.pl
  (decyzja 2026-11-14, później zmiana na szkolenia@iskt.pl samą zmienną), nadawca
  „Szkolenia ISKT” formularz@iskt.pl (odpowiedź 5); GDZIE: `.env.local` jako `ZGLOSZENIA_ODBIORCA`
  i `ZGLOSZENIA_NADAWCA` (nazwy w `.env.example`, ostateczne ustala plan); JAK sprawdzimy: e-mail
  testowy ma tego nadawcę i trafia do tego odbiorcy.
- [-] Klucze produkcyjne w Vercel (nie dotyczy: zlecenie 6; właściciel wpisze nowy klucz Resend w
  Vercel, decyzja 2026-11-14)

## Limity i płatności usług

- [ ] Plan Resend wystarcza na start, PO CO: limit wysyłki (W-12), JAK: właściciel sprawdza w panelu
  Resend (Settings → Billing/Usage) plan i limity (plan darmowy: 100 e-maili dziennie, 3000
  miesięcznie) i potwierdza, że wystarczą; GDZIE: panel Resend; JAK sprawdzimy: potwierdzenie
  właściciela w decyzje.md.

## Materiały

- [ ] Treść polityki prywatności i klauzuli przy formularzu, PO CO: informacja o przetwarzaniu
  danych (W-13), JAK: orkiestrator przygotowuje szkic (administrator ISKT Greenovation Sp. z o.o., cel,
  podstawa, okres, prawa, odbiorcy: dostawca poczty Resend), właściciel akceptuje go albo podaje
  własny tekst przed zadaniem W-13; GDZIE: odpowiedź w rozmowie, tekst trafia do kodu strony przez
  zadanie; JAK sprawdzimy: akceptacja właściciela w decyzje.md.
