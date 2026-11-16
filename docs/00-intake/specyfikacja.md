# Specyfikacja: M5 Produkcja na Vercel (krok 2)

Zlecenie: `docs/00-intake/zrodlo.md`. Zlecono (UTC): 2026-11-16T22:05Z.

## Cel i kontekst

Problem: strona działa tylko lokalnie; produkcyjna baza jest gotowa (M4, projekt Supabase
vwnvbhiuundeunyzhdxj), a domena szkolenia.iskt.pl wskazuje na Lovable bez naszych zmian. Rezultat:
serwis i panel działają pod https://szkolenia.iskt.pl na Vercel, z bazą produkcyjną i wysyłką
zgłoszeń, kolejne zmiany z `main` trafiają na produkcję automatycznie, a migracje bazy po
zatwierdzeniu właściciela.

Stan obecny: build przez `@lovable.dev/vite-tanstack-config` (nitro, preset `cloudflare-module`,
`vite.config.ts`); zmienne serwerowe z ADR-004 (Resend); baza i skrypty z ADR-005; poprzednie cykle w
`docs/cykle/*/`. Lovable synchronizuje się z repo; po przełączeniu go odłączamy (odpowiedź 7).

## Użytkownicy

| Grupa | Potrzeba | Uprawnienia |
|---|---|---|
| Odwiedzający | Oferta i formularz pod szkolenia.iskt.pl | Publiczny |
| Redakcja i właściciel | Panel `/panel` na produkcji | Konta Supabase z rolą (M4) |
| Właściciel | Konfiguracja Vercel, DNS, sekrety, zatwierdzanie migracji | Konta Vercel, seohost, GitHub |

## Zakres

W zakresie:

- Własna konfiguracja builda zamiast `@lovable.dev/vite-tanstack-config`: nitro z presetem Vercel,
  region fra1, te same wtyczki (Tailwind, React, TanStack Start, naprawa komentarza w `styles.css`)
  (W-18).
- Projekt Vercel połączony z repo: `main` → produkcja, PR → podgląd za ochroną Vercel (W-18, W-20).
- Zmienne: produkcja z adresem i kluczem publicznym Supabase, nowym kluczem Resend, adresami
  zgłoszeń i `ZGLOSZENIA_NAGLOWEK_IP`; podglądy bez klucza Resend (W-19, W-20).
- Automatyczne wdrażanie migracji z GitHub Actions po zatwierdzeniu w środowisku `production` (W-21).
- Przełączenie domeny szkolenia.iskt.pl w seohost na Vercel i odłączenie Lovable (W-22).
- Instrukcje krok po kroku dla właściciela i sprawdzenia po każdym kroku.

Poza zakresem:

- Plan Vercel Pro (odpowiedź 1: darmowy na razie), plan Supabase Pro.
- Trwały licznik limitu zgłoszeń (ADR-004 pkt 4; na Vercel limit w pamięci per instancja, Z3).
- Konta redakcji (decyzja 2026-11-16: po uruchomieniu strony, instrukcja w archiwum M4).
- Zmiany funkcji serwisu i panelu, monitoring błędów (Sentry), analityka.

## Wymagania

### W-18: Strona na Vercel z własną konfiguracją builda (musi) (bez karty: hosting i build, ekrany bez zmian)

Jako właściciel chcę, aby strona budowała się i działała na Vercel bez zależności od Lovable, aby
produkcja nie zależała od Lovable.

- Given repo bez `@lovable.dev/vite-tanstack-config`, when CI uruchamia `pnpm build`, then build
  przechodzi z presetem Vercel, a `pnpm lint`, `pnpm typecheck`, `pnpm test` i E2E są zielone.
- Given projekt Vercel połączony z repo, when `main` dostaje nowy commit, then Vercel buduje i
  publikuje produkcję w regionie fra1, a strona pod adresem `*.vercel.app` pokazuje ofertę z bazy
  produkcyjnej.
- Given funkcja serwerowa wysyłki zgłoszeń, when działa na Vercel, then czyta zmienne serwerowe
  z ustawień Vercel (bez `VITE_`).

### W-19: Wysyłka zgłoszeń na produkcji (musi) (bez karty: funkcja z M3 bez zmian, nowe środowisko)

Jako odwiedzający chcę wysłać zgłoszenie z produkcji, aby biuro dostało e-mail.

- Given zmienne produkcji w Vercel (nowy klucz Resend, odbiorca biuro@iskt.pl, nadawca
  formularz@iskt.pl, `ZGLOSZENIA_NAGLOWEK_IP=x-vercel-forwarded-for`), when odwiedzający wysyła
  zgłoszenie na produkcji, then e-mail dochodzi do biura (ręcznie: prawdziwa skrzynka).
- Given limit zgłoszeń, when kolejne zgłoszenia przychodzą z jednego adresu, then limit liczy adres z
  nagłówka platformy, nie z `x-forwarded-for` od klienta.

### W-20: Podglądy zmian za ochroną (powinno) (bez karty: ustawienia hostingu)

Jako właściciel chcę oglądać każdą zmianę przed scaleniem pod osobnym adresem, niedostępnym dla
obcych, aby sprawdzać zmiany bez ryzyka.

- Given PR do `main`, when Vercel zbuduje podgląd, then adres podglądu wymaga logowania do Vercel
  (Deployment Protection), a formularz na podglądzie pokazuje stan błędu zamiast wysyłać e-mail (brak
  klucza Resend w środowisku Preview).

### W-21: Automatyczne wdrażanie migracji po zatwierdzeniu (musi) (bez karty: CI/CD)

Jako właściciel chcę, aby migracje z `main` trafiały do bazy produkcyjnej automatycznie po moim
zatwierdzeniu, aby nie wykonywać ich ręcznie.

- Given nowa migracja w `supabase/migrations/` na `main`, when workflow wdrożenia startuje, then
  czeka na zatwierdzenie właściciela w środowisku GitHub `production` i dopiero potem wykonuje
  `supabase db push` na projekcie produkcyjnym.
- Given brak nowych migracji, when commit trafia na `main`, then workflow nie łączy się z produkcją.
- Given sekrety produkcji w GitHub, when workflow działa, then sekrety są tylko w środowisku
  `production` i nie trafiają do logów; inne workflowy i PR z forków ich nie dostają.

### W-22: Domena na Vercel i odłączenie Lovable (musi) (bez karty: DNS i ustawienia usług)

Jako odwiedzający chcę wchodzić na szkolenia.iskt.pl i trafiać na nową stronę, aby korzystać z
aktualnej oferty.

- Given domena szkolenia.iskt.pl dodana w Vercel, when właściciel ustawi rekord DNS w seohost według
  instrukcji, then https://szkolenia.iskt.pl serwuje stronę z Vercel z certyfikatem HTTPS.
- Given strona na Vercel działa pod domeną, when właściciel odłączy synchronizację Lovable z GitHub,
  then commity z `main` nie trafiają do Lovable, a Lovable nie zmienia repo.

## Karty funkcji

Brak nowych funkcji użytkowych: W-18…W-22 to hosting, konfiguracja i wdrażanie (nagłówki „bez
karty”). Ekrany bez zmian.

| Wymaganie | Karta | Rodzaj (pelna, skrocona) | Ekrany z designu |
|---|---|---|---|
| W-18…W-22 | bez karty | nie dotyczy | nie dotyczy |

## Lista startowa

Rzeczy zewnętrzne od właściciela: `docs/00-intake/lista-startowa.md`. Realizacja nie startuje,
dopóki lista nie jest kompletna.

## Typ projektu

Web (bez zmian).

| Konsekwencja | Ustalenie |
|---|---|
| Narzędzia testowe | Vitest, Playwright (chromium, webkit) na buildzie z nową konfiguracją; test workflow migracji (dry-run, warunki uruchomienia) |
| Dodatkowe punkty DoD | Build bez Lovable; sekrety tylko w Vercel i środowisku GitHub `production`; instrukcje dla właściciela |
| Ograniczenia runnera | Agenci bez dostępu do Vercel, seohost i sekretów; konfigurację w panelach robi właściciel |
| Kroki ręczne właściciela | Konto i projekt Vercel, zmienne, ochrona podglądów, DNS w seohost, środowisko i sekrety GitHub, odłączenie Lovable, nowy klucz Resend |

## Stack

| | Wybór | Uzasadnienie |
|---|---|---|
| Rekomendacja | TanStack Start + nitro z presetem `vercel`, integracja Git Vercel, GitHub Actions z środowiskiem `production` dla migracji | Standardowa ścieżka TanStack Start na Vercel; zgodna z kontraktem (Vercel w `konfiguracja.md`); migracje z zatwierdzeniem |
| Alternatywa | Wdrażanie przez `vercel` CLI z komputera właściciela (`scripts/deploy-prod.sh`) | Pełna kontrola, ale bez automatu, którego chce właściciel (odpowiedź 6) |

Zmiana kontraktu stacku (build bez Lovable, wdrożenia automatyczne) rozstrzyga ADR w 04-plan.

## Hosting

Vercel (plan Hobby na razie, region fra1) + Supabase Cloud UE (projekt vwnvbhiuundeunyzhdxj, plan
darmowy), konta właściciela. Bez zmian w `konfiguracja.md` poza ewentualnym `staging_url` (nie
dotyczy: brak stagingu).

## Design

Nie dotyczy: brak zmian ekranów.

## Kroki ręczne właściciela

- Konto Vercel (Hobby), import repo, region fra1, zmienne Production i Preview, Deployment Protection.
- Nowy klucz Resend dla produkcji.
- Środowisko GitHub `production` z wymaganym zatwierdzeniem i sekretami Supabase.
- Domena w Vercel i rekord DNS w seohost; odłączenie Lovable.

## Ryzyka

| Obszar | Ocena (tak, nie, do ustalenia) | Skutek |
|---|---|---|
| Auth i RLS, role użytkowników | nie | Bez zmian (M2, M4) |
| Płatności | nie | Brak |
| Dane osobowe | tak | ADR w 04-plan: zgłoszenia na produkcji (ADR-004 bez zmian) i logi Vercel bez danych osobowych; podglądy bez wysyłki |
| AI przetwarzające dane użytkowników | nie | Brak |
| Migracje bazy produkcyjnej | tak | ADR w 04-plan: automatyczne `db push` z GitHub Actions po zatwierdzeniu w środowisku `production`; zmiana zasady „brak poświadczeń produkcji w GitHub” z AGENTS.md |
| Upload plików, integracje zewnętrzne | tak | ADR w 04-plan: Vercel (build, funkcje, nagłówek IP), Resend w produkcji, DNS seohost |
| Płatne usługi, sekrety, nowe konta | tak | ADR w 04-plan: sekrety w Vercel i GitHub `production`; plan Hobby a regulamin Vercel (strona komercyjna) jako znane ryzyko właściciela |

## Szacunek poglądowy

| Miara | Wartość |
|---|---|
| Zadania | 3–4 (build Vercel; workflow migracji; instrukcje wdrożenia i domeny; dokumentacja wydania) |
| Czas kalendarzowy | 1–2 dni |
| Czas właściciela | ok. 1,5 godziny (Vercel, sekrety, DNS, sprawdzenia) |

## Tryb procesu

Tryb M: zmiana hostingu, sekrety produkcji w GitHub i automatyczne wdrażanie migracji to obszary
ryzyka. Zlecono 2026-11-16T22:05Z (UTC).

## Do potwierdzenia

| Nr | Karta | Pytanie albo założenie | Proponowana odpowiedź | Źródło (zdecyduj sam, luka bez pytania) |
|---|---|---|---|---|
| Z1 | W-18 | Wdrożenie aplikacji (nie bazy): automatycznie z `main` przez integrację Git Vercel | Tak: każdy merge do `main` publikuje produkcję; cofnięcie przez „Promote” poprzedniego wdrożenia w Vercel. Zmienia to zasadę „produkcję wdraża wyłącznie właściciel przez deploy-prod.sh” (ADR w 04-plan) | luka bez pytania |
| Z2 | W-22 | Kolejność przełączenia | Najpierw strona na adresie `*.vercel.app` i sprawdzenie, potem DNS, na końcu odłączenie Lovable | luka bez pytania |
| Z3 | W-19 | Limit zgłoszeń na Vercel | Zostaje w pamięci per instancja (ADR-004), trwały licznik później | luka bez pytania |
| Z4 | W-21 | Sekrety w GitHub | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` wyłącznie w środowisku `production` z wymaganym zatwierdzeniem właściciela | luka bez pytania |
