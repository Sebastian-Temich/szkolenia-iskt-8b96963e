# Lista startowa

Wszystko zewnętrzne, czego realizacja potrzebuje od właściciela: konta, dostępy, domeny, klucze
testowe, limity i płatności usług, materiały. Spisuje ją `sh-intake` na początku zlecenia jedną listą,
a orkiestrator zaznacza pozycję po potwierdzeniu właściciela (na `main`).

`shctl task ready` i `shctl task dispatch` nie startują realizacji, dopóki jest tu choć jedno pole
`- [ ]`. Pole bez zastosowania: `- [-] treść (nie dotyczy: powód)`.

Format pozycji: `- [ ] CO, PO CO (W-NN), JAK: kroki dla właściciela; GDZIE wpisać; JAK sprawdzimy`.

Cykl M4 wymienia tylko nowe rzeczy zewnętrzne (poprzednie: `docs/cykle/*/00-intake/lista-startowa.md`).

## Konta i dostępy

- [x] Projekt Supabase produkcji, PO CO: baza produkcyjna (W-15…W-17), JAK: istniejący projekt
  vwnvbhiuundeunyzhdxj, plan darmowy (decyzja 2026-11-16); GDZIE: dashboard Supabase; JAK
  sprawdzimy: status projektu ACTIVE_HEALTHY (odczyt MCP 2026-11-16).
- [x] Konto admina w aplikacji, PO CO: zaproszenia i role (W-17), JAK: konto właściciela z rolą admin
  już jest (odczyt MCP 2026-11-16); GDZIE: auth Supabase; JAK sprawdzimy: rola admin w `user_roles`.

## Domeny i DNS

- [-] Domena (nie dotyczy kroku 1: przełączenie na Vercel w kolejnym kroku)

## Klucze testowe i zmienne

- [-] Hasło bazy produkcyjnej (nie dotyczy listy: zna je właściciel i wpisuje tylko interaktywnie w
  CLI przy `supabase link`; nie trafia do repo, docs ani agentów)

## Limity i płatności usług

- [x] Plan Supabase, PO CO: koszt i ograniczenia (W-15), JAK: plan darmowy na razie (decyzja
  2026-11-16); znane ograniczenia w ryzykach specyfikacji; GDZIE: dashboard; JAK sprawdzimy: decyzje.md.

## Materiały

- [ ] Supabase CLI na komputerze właściciela, PO CO: kopia i migracje (W-15), JAK: `brew install
  supabase/tap/supabase` (macOS), potem `supabase login`; GDZIE: Terminal właściciela; JAK sprawdzimy:
  `supabase --version` pokazuje wersję 2.x lub nowszą.
