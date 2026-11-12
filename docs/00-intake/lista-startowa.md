# Lista startowa

Wszystko zewnętrzne, czego realizacja potrzebuje od właściciela: konta, dostępy, domeny, klucze
testowe, limity i płatności usług, materiały. Spisuje ją `sh-intake` na początku zlecenia jedną listą,
a orkiestrator zaznacza pozycję po potwierdzeniu właściciela (na `main`).

`shctl task ready` i `shctl task dispatch` nie startują realizacji, dopóki jest tu choć jedno pole
`- [ ]`. Pole bez zastosowania: `- [-] treść (nie dotyczy: powód)`.

Wartości sekretów nigdy nie trafiają do tego pliku: właściciel wpisuje je do `.env.local` w repo głównym
albo do panelu usługi, a tu tylko potwierdza, że są.

Format pozycji: `- [ ] CO, PO CO (W-NN), JAK: kroki dla właściciela; GDZIE wpisać; JAK sprawdzimy`.

## Konta i dostępy

- [ ] Docker Desktop na serwerze włączony na czas pracy agentów, PO CO: lokalna baza Supabase
  (W-02, W-03, W-04, W-05), JAK: uruchom Docker Desktop na serwerze i zostaw go włączonego (Docker
  jest zainstalowany; zmiany Docker Desktop robi tylko właściciel); GDZIE: nic do wpisania;
  sprawdzimy: `shctl db start --projekt szkolenia-iskt` po dodaniu `supabase/config.toml` kończy się
  sukcesem
- [-] Konta usług (Supabase w chmurze, Vercel) (nie dotyczy: M1 działa wyłącznie lokalnie; konta
  wchodzą w zlecenie przenosin)

## Domeny i DNS

- [-] Domena i DNS (nie dotyczy: brak publikacji w M1)

## Klucze testowe i zmienne

- [-] Klucze i zmienne (nie dotyczy: `.env.local` wypełnia się kluczami lokalnego stacku z `shctl db
  status`; brak kluczy chmury)

## Limity i płatności usług

- [-] GitHub Actions: płatności konta (nie dotyczy: repo publiczne, CI na runnerach GitHuba bez opłat)

## Materiały

- [-] Design, teksty, logotypy (nie dotyczy: M1 nie zmienia ekranów; dane startowe z makiet w repo)
