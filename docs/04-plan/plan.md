# Plan: szkolenia-iskt, cykl M5-vercel (krok 2: produkcja na Vercel)

Źródło: `docs/00-intake/specyfikacja.md` (cykl M5, rewizja cd69c0b). Wymagania W-18…W-22. Plany
poprzednich cykli w `docs/cykle/*/04-plan/plan.md`; baza produkcyjna z M4 (ADR-005).

## Architektura

Zmiana: konfiguracja builda bez Lovable (preset Vercel), wdrażanie aplikacji przez integrację Git
Vercel, workflow wdrażania migracji z zatwierdzeniem, przełączenie domeny i odłączenie Lovable.
Funkcje serwisu i panelu bez zmian.

### Moduły i punkty wejścia

| Moduł / funkcja | Punkt wejścia (strona, trasa, komenda, endpoint) | Design (pliki) | Wymagania |
|---|---|---|---|
| Build i serwer | `vite.config.ts` (nitro preset `vercel`, fra1), `pnpm build`, `pnpm dev` | brak | W-18 |
| Wdrożenie aplikacji | Integracja Git Vercel: `main` → Production, PR → Preview | brak | W-18, W-20 |
| Zmienne i wysyłka | Ustawienia Vercel (Production, Preview); `src/lib/zgloszenia/` bez zmian | brak | W-19, W-20 |
| Migracje produkcji | `.github/workflows/migracje-produkcja.yml`, środowisko GitHub `production` | brak | W-21 |
| Domena i Lovable | Vercel Domains, DNS seohost (CNAME `szkolenia`), GitHub → Lovable | brak | W-22 |
| Instrukcje | `docs/wydanie/techniczna/produkcja-vercel.md` | brak | W-18…W-22 |

### Model danych

Bez zmian schematu. Zasada migracji zgodnych wstecz (expand/contract) staje się warunkiem kolejności
wdrożeń: aplikacja z `main` wdraża się od razu, migracja po zatwierdzeniu (ADR-006 pkt 3).

### Integracje

Vercel (build, funkcje w fra1, nagłówek `x-vercel-forwarded-for`), Resend z nowym kluczem w
produkcji, Supabase CLI w GitHub Actions, DNS seohost.

### Bezpieczeństwo

- Sekrety: Vercel (Production: klucz Resend; Preview bez niego); GitHub tylko w środowisku
  `production` z wymaganym zatwierdzeniem właściciela (ADR-006 pkt 6). W repo tylko nazwy.
- Podglądy za Vercel Deployment Protection; panel na podglądzie działa na danych produkcji (ADR-006
  pkt 5, instrukcja dla redakcji).
- Dane osobowe: bez zmian względem ADR-004; logi Vercel bez danych osobowych (biała lista z M3).

### Środowiska i droga na produkcję

Zmiana względem `proces.md` i AGENTS.md: aplikację wdraża merge do `main` (po review i zielonym CI),
migracje workflow z zatwierdzeniem właściciela; `scripts/deploy-prod.sh` i zablokowany workflow
`deploy-prod` przestają być ścieżką tego projektu (zostają w repo jako szablon). Brak stagingu
(podglądy PR zamiast stagingu, bez `STAGING_DB_URL`).

### Decyzje

- [ADR-006: Produkcja na Vercel, automatyczne wdrożenia i migracje z zatwierdzeniem](adr/ADR-006-produkcja-vercel.md)
- Bez zmian: ADR-002…ADR-005. Kontrakt stacku (Framework: build bez `@lovable.dev/vite-tanstack-config`) zmienia ADR-006.

## Kamienie milowe

| Nr | Kamień milowy | Rezultat | Wymagania | Warunek startu |
|---|---|---|---|---|
| M5 | Produkcja na Vercel | Build bez Lovable z CI zielonym; strona na `*.vercel.app` z bazą produkcyjną i wysyłką; podglądy za ochroną; workflow migracji z zatwierdzeniem; domena szkolenia.iskt.pl na Vercel; Lovable odłączony; dokumentacja wydania M5 | W-18…W-22 | Plan zaakceptowany |

Zadania (06-zadania, ID od T14): build Vercel bez Lovable (kod, CI, AGENTS.md, README) → workflow
migracji i instrukcja wdrożenia dla właściciela (Vercel, zmienne, ochrona, środowisko GitHub, DNS,
Lovable, rollback) → (wykonanie przez właściciela krok po kroku) → dokumentacja wydania M5.

## Zadania właściciela

| Zadanie | Przed | Uwagi |
|---|---|---|
| Projekt Vercel z repo, region fra1, zmienne Production i Preview, Deployment Protection | QA M5 | instrukcja z T15, krok po kroku z orkiestratorem |
| Nowy klucz Resend dla produkcji | zmiennymi Production | wartość tylko w Vercel |
| Środowisko GitHub `production` z wymaganym zatwierdzeniem i sekretami Supabase | pierwszą migracją po M5 | ADR-006 pkt 6 |
| Rekord DNS w seohost, domena w Vercel | po sprawdzeniu `*.vercel.app` | Z2 |
| Odłączenie Lovable od GitHub | po domenie | odpowiedź 7 |
| Projekt Supabase staging, `STAGING_DB_URL` | — | nie dotyczy: brak stagingu (podglądy PR) |
| Konta redakcji (instrukcja M4, kroki 11–12) | po uruchomieniu strony | decyzja 2026-11-16 |

## Ryzyka

| Ryzyko | Skutek | Działanie (ADR, spike, dowody) | Właściciel |
|---|---|---|---|
| Build bez Lovable różni się zachowaniem (SSR, zmienne, devtools) | Strona albo funkcja serwerowa nie działa | Pełne CI (jakość, build, E2E) na nowej konfiguracji; build Vercel na podglądzie PR przed merge | worker T14, review |
| Merge do `main` z kodem wymagającym niewdrożonej migracji | Błędy na produkcji | Expand/contract (ADR-006 pkt 3), review pilnuje | review |
| Sekrety produkcji w GitHub | Wyciek dostępu do bazy | Tylko środowisko `production` z zatwierdzeniem, bez `pull_request_target`, minimalne uprawnienia | worker T15, właściciel |
| Panel na podglądzie zmienia produkcję | Niezamierzone zmiany danych | Instrukcja dla redakcji, podglądy tylko dla zalogowanych do Vercel | właściciel |
| Plan Hobby Vercel a regulamin | Blokada konta | Znane ryzyko, decyzja właściciela | właściciel |
| Przełączenie DNS | Przerwa w działaniu | Najpierw `*.vercel.app`, krótki TTL, rollback rekordu | właściciel |

## Scenariusze odbioru

| Nr | Scenariusz | Kroki | Oczekiwany wynik | Wymagania | Kamień |
|---|---|---|---|---|---|
| O-34 | Build bez Lovable | CI na PR T14: `jakosc`, build, `e2e` | Zielone; brak `@lovable.dev/vite-tanstack-config` | W-18 | M5 |
| O-35 | Strona na Vercel | `*.vercel.app` po merge: `/`, `/szkolenia`, szczegół, `/trenerzy`, `/polityka-prywatnosci` | 9 szkoleń z bazy produkcyjnej, strony działają | W-18 | M5 |
| O-36 | Panel na produkcji | Logowanie kontem admina na `*.vercel.app/panel` | Lista szkoleń | W-18 | M5 |
| O-37 | Wysyłka (ręcznie, właściciel) | Zgłoszenie z produkcji | E-mail na biuro@iskt.pl | W-19 | M5 |
| O-38 | Podgląd chroniony | Adres podglądu PR w oknie prywatnym | Wymaga logowania do Vercel; formularz pokazuje błąd wysyłki | W-20 | M5 |
| O-39 | Workflow migracji | `workflow_dispatch` bez nowych migracji → zatwierdzenie | `db push --dry-run`: brak migracji do wdrożenia; sekrety niewidoczne w logu | W-21 | M5 |
| O-40 | Domena | https://szkolenia.iskt.pl | Strona z Vercel, certyfikat HTTPS | W-22 | M5 |
| O-41 | Lovable odłączony | Commit na `main` | Brak zmian w Lovable; Lovable nie commituje do repo | W-22 | M5 |

## Zakres autoryzacji

Po akceptacji orkiestrator zapisuje go w `decyzje.md` przez `shctl decision add --rola wlasciciel`.

- Na co: kamień M5 (zadania od T14) i instrukcje dla właściciela.
- Zakres: `vite.config.ts`, `package.json`, lockfile, CI, nowy workflow migracji, `AGENTS.md`,
  `README.md`, `docs/wydanie/`; bez zmian funkcji aplikacji i schematu; konfigurację Vercel, GitHub,
  seohost i Lovable wykonuje właściciel.
- Do kiedy: do odbioru M5.
- Wymaga nowej decyzji właściciela: plan Pro (Vercel, Supabase), staging, zmiany funkcji, trwały
  licznik limitu.

## Gotowość środowiska

`shctl doctor` 2026-11-15T15:06Z: 0 błędów. Konto Vercel i dostęp DNS seohost potwierdzone
(2026-11-16). Baza produkcyjna gotowa (M4).

## Następny krok

Orkiestrator: review etapu 04-plan, potem akceptacja właściciela.
