# Lista startowa

Wszystko zewnętrzne, czego realizacja potrzebuje od właściciela: konta, dostępy, domeny, klucze
testowe, limity i płatności usług, materiały. Spisuje ją `sh-intake` na początku zlecenia jedną listą,
a orkiestrator zaznacza pozycję po potwierdzeniu właściciela (na `main`).

`shctl task ready` i `shctl task dispatch` nie startują realizacji, dopóki jest tu choć jedno pole
`- [ ]`. Pole bez zastosowania: `- [-] treść (nie dotyczy: powód)`.

Format pozycji: `- [ ] CO, PO CO (W-NN), JAK: kroki dla właściciela; GDZIE wpisać; JAK sprawdzimy`.

## Konta i dostępy

- [-] Konta usług (nie dotyczy: cykl M2 działa na bazie lokalnej i w CI; Docker na serwerze już działa, potwierdzony w M1)

## Domeny i DNS

- [-] Domena i DNS (nie dotyczy: brak publikacji)

## Klucze testowe i zmienne

- [-] Klucze i zmienne (nie dotyczy: lokalny stack `shctl db`, bez kluczy chmury)

## Limity i płatności usług

- [-] GitHub Actions (nie dotyczy: repo publiczne, CI bez opłat)

## Materiały

- [-] Design, teksty (nie dotyczy: brak zmian ekranów)
