# Lista startowa

Wszystko zewnętrzne, czego realizacja potrzebuje od właściciela: konta, dostępy, domeny, klucze
testowe, limity i płatności usług, materiały. Spisuje ją `sh-intake` na początku zlecenia jedną listą,
a orkiestrator zaznacza pozycję po potwierdzeniu właściciela (na `main`).

`shctl task ready` i `shctl task dispatch` nie startują realizacji, dopóki jest tu choć jedno pole
`- [ ]`. Pole bez zastosowania: `- [-] treść (nie dotyczy: powód)`.

Format pozycji: `- [ ] CO, PO CO (W-NN), JAK: kroki dla właściciela; GDZIE wpisać; JAK sprawdzimy`.

Cykl M5 wymienia tylko nowe rzeczy zewnętrzne. Zadania w panelach usług (projekt Vercel, zmienne,
DNS, środowisko GitHub) wykonuje właściciel według instrukcji z realizacji; przed realizacją potrzebne
są tylko konta i dostępy poniżej.

## Konta i dostępy

- [x] Konto Vercel (plan Hobby), PO CO: hosting (W-18), JAK: rejestracja na vercel.com kontem GitHub
  właściciela (Continue with GitHub), bez tworzenia projektu (zrobimy to według instrukcji); GDZIE:
  vercel.com; JAK sprawdzimy: właściciel potwierdza, że loguje się do dashboardu Vercel.
- [x] Dostęp do panelu DNS seohost dla iskt.pl, PO CO: przełączenie domeny (W-22), JAK: właściciel
  sprawdza, że w panelu seohost widzi strefę DNS domeny iskt.pl i może edytować rekordy; GDZIE: panel
  seohost; JAK sprawdzimy: potwierdzenie właściciela.

## Domeny i DNS

- [-] Zmiana DNS (nie dotyczy listy: wykonuje się w realizacji według instrukcji, na końcu cyklu)

## Klucze testowe i zmienne

- [-] Nowy klucz Resend i zmienne produkcji (nie dotyczy listy: właściciel tworzy je i wpisuje w
  Vercel według instrukcji w realizacji; wartości nigdy w repo)

## Limity i płatności usług

- [x] Plan Vercel, PO CO: koszt (W-18), JAK: Hobby na razie (decyzja 2026-11-16); GDZIE: vercel.com;
  JAK sprawdzimy: decyzje.md.

## Materiały

- [-] Materiały (nie dotyczy: brak zmian treści)
