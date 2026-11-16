# Uruchomienie produkcji na Vercel (szkolenia.iskt.pl)

Instrukcja dla właściciela. Decyzja i uzasadnienie: `docs/04-plan/adr/ADR-006-produkcja-vercel.md`
(pkt 2, 4, 5, 6, 7), wymagania W-18, W-20, W-21, W-22, decyzje w `docs/decyzje.md` z 2026-11-16 (M5).
Pliki w repo: `scripts/vercel-pomin-build.sh` (Ignored Build Step), `.github/workflows/migracje-produkcja.yml`
(migracje produkcji), `.github/workflows/ci.yml` (checki `jakosc` i `e2e`). Build aplikacji: T14 (#70).

## Zasady

- Wszystkie kroki wykonujesz Ty, w panelach Vercel, Lovable, Resend, GitHub i seohost. Agenci nie mają
  dostępu do tych paneli ani do produkcji.
- Wartości sekretów (klucz Resend, token Supabase, hasło bazy) wpisujesz tylko w polach paneli. Nie
  zapisujesz ich w repo, plikach, notatkach, issue ani w rozmowie z agentami. W tej instrukcji są
  wyłącznie nazwy zmiennych.
- Kroki wykonujesz po kolei. Gdy wynik różni się od „Oczekiwanego wyniku”, robisz to, co mówi „Przy
  błędzie”, i nie idziesz dalej.
- Przed krokiem 1 na `main` są zmiany z #70 (build Vercel) i #71 (skrypt, workflow, ta instrukcja).
  Sprawdzenie: na GitHubie w `main` istnieją `scripts/vercel-pomin-build.sh` i
  `.github/workflows/migracje-produkcja.yml`.

## Kolejność w skrócie

| Krok | Gdzie | Co | ADR-006 |
|---|---|---|---|
| 1 | Lovable | Odłączenie synchronizacji z GitHubem | pkt 2, 7 |
| 2 | Vercel | Framework, build, Node.js | pkt 1, 2 |
| 3 | Vercel | Ignored Build Step: skrypt zamiast `exit 0` | pkt 2 |
| 4 | Vercel | Region funkcji fra1 | pkt 1 |
| 5 | Resend | Nowy klucz API (przed zmiennymi Production) | pkt 4 |
| 6 | Vercel | Zmienne Production i Preview | pkt 4 |
| 7 | Vercel | Deployment Checks: `jakosc` i `e2e` | pkt 2 |
| 8 | Vercel | Deployment Protection (podglądy) | pkt 5 |
| 9 | Vercel | Pierwsze wdrożenie i sprawdzenie `*.vercel.app` | pkt 7 |
| 10 | GitHub | Środowisko `production`: reviewer, tylko `main`, sekrety | pkt 6 |
| 11 | GitHub | Test workflow migracji przez `workflow_dispatch` | pkt 6 |
| 12 | Vercel, seohost | Domena `szkolenia.iskt.pl` i rekord CNAME | pkt 7 |

Cofnięcie: sekcja „Rollback” na końcu (aplikacja przez Promote, DNS przez poprzedni rekord).

## Decyzja: e2e na pushu do `main` i Deployment Checks

Wariant ustalony przez orkiestratora (`docs/decyzje.md`, 2026-11-16, „M5: e2e na pushu do main”):
job `e2e` w `ci.yml` uruchamia się na każdym PR, na pushu do `main` i ręcznie, a Vercel Deployment Checks
czekają na `jakosc` i `e2e` commita z `main` (krok 7). Uzasadnienie: produkcja wdraża się z `main`
automatycznie, a na `main` trafiają też commity spoza PR (orkiestrator, do kroku 1 także Lovable);
bez `e2e` na pushu wdrożenie czekałoby tylko na lint, typy, testy jednostkowe i build. Koszt: każdy push
do `main` uruchamia E2E (kilka minut runnera), także dla commitów samej dokumentacji; Vercel takich
commitów i tak nie buduje (krok 3). Wariant alternatywny („Deployment Checks tylko z `jakosc`”) wymaga
zmiany ADR-006.

## Kroki

### 1. Odłączenie synchronizacji Lovable z GitHubem

Lovable → projekt szkoleń → **Settings** (ikona projektu) → **GitHub** (albo **Integrations → GitHub**)
→ **Disconnect**. Nie usuwasz repo w GitHubie i nie wyłączasz opublikowanej strony Lovable (działa pod
domeną do kroku 12). Nie klikasz **Publish** ani **Share**.

Oczekiwany wynik: Lovable pokazuje projekt bez połączenia z GitHubem. Na GitHubie: Settings → Integrations
→ **GitHub Apps** — aplikacja Lovable nie ma już dostępu do repo (albo repo zniknęło z jej listy
„Repository access”). Zmiana w edytorze Lovable nie tworzy commita na `main`.

Przy błędzie: brak opcji Disconnect → GitHub → Settings (konta) → Applications → Installed GitHub Apps →
Lovable → **Configure** → usuń repo z „Repository access”. Commit z Lovable pojawił się na `main` po
odłączeniu → nie cofasz go (AGENTS.md), zgłoś orkiestratorowi.

### 2. Framework, build i Node.js

Vercel → projekt → **Settings → Build and Deployment**:

- **Framework Preset**: `TanStack Start` (jeśli Vercel go nie oferuje: `Other`);
- **Build Command**: włącz Override, `pnpm build`;
- **Install Command**: włącz Override, `pnpm install --frozen-lockfile`;
- **Output Directory**: bez Override (build tworzy `.vercel/output`, Vercel czyta go sam);
- **Root Directory**: puste (katalog główny repo);
- **Node.js Version**: `24.x` (zgodnie z funkcją z buildu T14, `runtime: nodejs24.x`).

**Save**.

Oczekiwany wynik: ustawienia zapisane bez ostrzeżeń. Wersję pnpm Vercel bierze z `packageManager` w
`package.json` (pnpm 12).

Przy błędzie: Vercel nie zna pnpm 12 albo instaluje inną wersję → w kroku 9 log builda pokaże błąd
instalacji; wtedy zatrzymaj się i zgłoś orkiestratorowi z fragmentem logu (bez zmiennych).

### 3. Ignored Build Step ze skryptem

Vercel → projekt → **Settings → Git → Ignored Build Step** → **Behavior**: `Custom` (Run my Bash script),
**Command**:

```sh
bash scripts/vercel-pomin-build.sh
```

Zastępuje dotychczasowe `exit 0` (decyzje.md, 2026-11-16, „projekt Vercel założony przed konfiguracją
builda”). **Save**.

Jak działa skrypt: porównuje pliki zmienione od `VERCEL_GIT_PREVIOUS_SHA` (ostatnie udane wdrożenie
gałęzi) do bieżącego commita, czyli wszystkie commity pushu. Pomija build (kod 0) tylko, gdy każdy
zmieniony plik leży w `docs/`, `.github/`, `.claude/`, `.lovable/`, `scripts/` albo jest jednym z
`CHANGELOG.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `roadmap.md`. W każdym innym przypadku buduje
(kod 1), także przy braku poprzedniego wdrożenia, gdy commit poprzedniego wdrożenia nie jest w klonie,
i przy ponownym wdrożeniu tego samego commita. Inny commit o zawartości identycznej z wdrożoną (np.
zmiana w `docs/` i jej revert) nie buduje. Zmiana w `supabase/` buduje. Lista jest w skrypcie,
testy: `scripts/tests/vercel-pomin-build.bats` (job CI `skrypty`).

Oczekiwany wynik: pole pokazuje komendę zamiast `exit 0`. Skutek sprawdzisz w kroku 9 (log builda zawiera
linię `vercel-pomin-build: buduję (…)`).

Przy błędzie: build kończy się „Canceled by Ignored Build Step”, choć zmieniła się aplikacja → przeczytaj
w logu linię `vercel-pomin-build:`; zgłoś orkiestratorowi z tą linią. Do czasu poprawki możesz wpisać
`exit 1` (zawsze buduj).

### 4. Region funkcji fra1

Vercel → projekt → **Settings → Functions → Function Region**: `Frankfurt, Germany (West) – fra1`
(ustawione już przy zakładaniu projektu; sprawdzasz). Build z T14 też zapisuje `regions: ["fra1"]` w
konfiguracji funkcji.

Oczekiwany wynik: zaznaczony tylko fra1.

Przy błędzie: inny region → zmień na fra1 i **Save**; plan Hobby pozwala na jeden region.

### 5. Nowy klucz Resend (przed zmiennymi Production)

Resend → **API Keys → Create API Key**: nazwa np. `szkolenia-vercel-produkcja`, **Permission**:
`Sending access`, **Domain**: domena nadawcy zgłoszeń (ta z `ZGLOSZENIA_NADAWCA`). **Add**. Klucz pokazuje
się raz: kopiujesz go od razu do schowka i wklejasz w kroku 6 (nie zapisujesz w pliku ani notatce).

Klucza używanego dotąd lokalnie albo w Lovable nie przenosisz na Vercel (ADR-006 pkt 4: nowy klucz).

Oczekiwany wynik: nowy klucz na liście API Keys z uprawnieniem „Sending access” i jedną domeną.

Przy błędzie: domena nie jest zweryfikowana w Resend (status inny niż „Verified”) → wysyłka z produkcji
nie zadziała; najpierw weryfikacja domeny (Resend → Domains), potem ten krok.

### 6. Zmienne Production i Preview

Vercel → projekt → **Settings → Environment Variables**. Każdą zmienną dodajesz przez **Add New**: nazwa,
wartość, zaznaczone środowiska. Zmienne `VITE_*` są wpisywane w kod w czasie builda (`vite.config.ts`,
T14), więc muszą być ustawione dla **Production i Preview przed pierwszym buildem** (krok 9); zmiana
później wymaga nowego wdrożenia (Redeploy).

| Nazwa | Production | Preview | Wartość (skąd) |
|---|---|---|---|
| `VITE_SUPABASE_URL` | tak | tak | adres API projektu `vwnvbhiuundeunyzhdxj` (Supabase → Project Settings → API) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | tak | tak | klucz publishable (`anon`) tego projektu; nigdy `service_role` |
| `RESEND_API_KEY` | tak, **Sensitive** | **nie** | klucz z kroku 5 |
| `ZGLOSZENIA_ODBIORCA` | tak | tak | adres biura, które dostaje zgłoszenia (decyzje.md 2026-11-16) |
| `ZGLOSZENIA_NADAWCA` | tak | tak | nadawca z domeny zweryfikowanej w Resend |
| `ZGLOSZENIA_NAGLOWEK_IP` | tak | tak | `x-vercel-forwarded-for` |

Development: bez zmiennych (lokalnie `.env.local`).

Oczekiwany wynik: 6 zmiennych w Production, 5 w Preview (bez `RESEND_API_KEY`). Na podglądzie formularz
zgłoszenia pokaże stan błędu zamiast wysłać e-mail (W-20).

Przy błędzie: `RESEND_API_KEY` trafił do Preview → edytuj zmienną i odznacz Preview. Klucz wkleiłeś w
złe pole albo do innej zmiennej → usuń zmienną, w Resend usuń klucz i wróć do kroku 5.

### 7. Deployment Checks: `jakosc` i `e2e`

Vercel → projekt → **Settings → Deployment Checks** → **Add Checks** → źródło GitHub → zaznacz checki
`jakosc` i `e2e` (joby workflow „CI” z `ci.yml`). **Save**.

Wymagane checki muszą już istnieć na commitach repo: oba uruchamiają się na każdym PR i na pushu do
`main` (sekcja „Decyzja” wyżej). Gdy lista jest pusta, poczekaj na zakończenie CI dowolnego PR albo pushu
do `main`.

Oczekiwany wynik: w Deployment Checks widać `jakosc` i `e2e`. Wdrożenie produkcji z `main` buduje się,
ale zostaje promowane na domenę produkcji dopiero po zielonych obu checkach tego commita.

Przy błędzie: check czerwony → wdrożenie nie wejdzie na produkcję (tak ma być); zgłoś orkiestratorowi
numer runu z GitHub Actions. Nie usuwasz checków, żeby przepchnąć wdrożenie.

### 8. Deployment Protection (podglądy)

Vercel → projekt → **Settings → Deployment Protection** → **Vercel Authentication**: włączone,
**Standard Protection** (podglądy i adresy wdrożeń tylko dla zalogowanych do Vercel; domena produkcji
publiczna). **Save**.

Ryzyko (ADR-006 pkt 5): podgląd korzysta z bazy produkcyjnej. Do panelu na podglądzie logujesz się
tylko kontami redakcji, a każdą zmianę w panelu podglądu traktujesz jak zmianę produkcji.

Oczekiwany wynik: adres podglądu PR otwarty w oknie prywatnym przeglądarki (bez logowania do Vercel)
pokazuje ekran logowania Vercel.

Przy błędzie: podgląd otwiera się bez logowania → sprawdź, czy wybrany jest „Standard Protection”, a nie
„Only Production Deployments” wyłączone albo „None”.

### 9. Pierwsze wdrożenie i sprawdzenie `*.vercel.app`

Vercel → projekt → **Deployments** → **Create Deployment** (gałąź `main`, ostatni commit), albo przy
ostatnim wdrożeniu `main` menu **⋯ → Redeploy** (bez „Use existing Build Cache”). Pierwsze wdrożenie nie ma
`VERCEL_GIT_PREVIOUS_SHA`, więc skrypt z kroku 3 buduje.

Oczekiwany wynik:

1. Log builda: linia `vercel-pomin-build: buduję (…)`, potem `pnpm install`, `pnpm build`, a na końcu
   „Deployment completed”. Status po checkach z kroku 7: **Ready**, środowisko **Production**.
2. Adres produkcji `https://NAZWA-PROJEKTU.vercel.app` (Vercel → projekt → **Domains**) otwiera stronę
   główną; `/szkolenia` pokazuje szkolenia z bazy produkcyjnej.
3. Szczegóły dowolnego szkolenia otwierają się bez błędu; logowanie do panelu kontem admina działa.
4. Formularz zgłoszenia: jedno zgłoszenie testowe z polem uwag „TEST — proszę zignorować” dochodzi na
   adres z `ZGLOSZENIA_ODBIORCA`.
5. Vercel → projekt → **Settings → Functions** albo szczegóły wdrożenia → **Functions**: region `fra1`.
6. Podgląd dowolnego PR (link „Visit Preview” w PR) wymaga logowania do Vercel, a formularz na podglądzie
   kończy się komunikatem błędu (bez e-maila).

Przy błędzie: build pada na instalacji albo `pnpm build` → zgłoś orkiestratorowi fragment logu (bez
zmiennych). Strona działa, ale bez szkoleń albo z błędem bazy → sprawdź `VITE_SUPABASE_URL` i
`VITE_SUPABASE_PUBLISHABLE_KEY` (krok 6) i wykonaj Redeploy (zmienne `VITE_*` są w buildzie). Formularz
na produkcji pokazuje błąd → sprawdź `RESEND_API_KEY`, `ZGLOSZENIA_NADAWCA` i domenę w Resend; logi
funkcji: wdrożenie → **Logs**. Do czasu naprawy domena dalej wskazuje Lovable, więc odwiedzający niczego
nie widzą.

### 10. Środowisko GitHub `production`

GitHub → repo → **Settings → Environments → New environment** → nazwa `production` → **Configure
environment**:

1. **Deployment protection rules → Required reviewers**: zaznacz i dodaj siebie. **Prevent self-review**
   zostaw wyłączone (jesteś jedynym reviewerem). **Save protection rules**.
2. **Deployment branches and tags**: `Selected branches and tags` → **Add deployment branch or tag
   rule** → `main`. Workflow ma dodatkowo warunek `github.ref == 'refs/heads/main'`.
3. **Environment secrets → Add environment secret**, trzy razy:
   - `SUPABASE_ACCESS_TOKEN`: nowy token z Supabase → Account → **Access Tokens → Generate new token**
     (nazwa np. `github-migracje-produkcja`);
   - `SUPABASE_DB_PASSWORD`: hasło bazy projektu `vwnvbhiuundeunyzhdxj`;
   - `SUPABASE_PROJECT_ID`: `vwnvbhiuundeunyzhdxj`.

Sekretów nie dodajesz w **Settings → Secrets and variables → Actions → Repository secrets**: tylko w
środowisku.

Oczekiwany wynik: środowisko `production` z jednym reviewerem, regułą gałęzi `main` i trzema sekretami;
lista Repository secrets nie zawiera żadnego z nich.

Przy błędzie: sekret dodany jako Repository secret → usuń go tam i dodaj w środowisku. Token Supabase
ujawniony (wklejony gdzie indziej) → Supabase → Access Tokens → **Revoke** i nowy token.

### 11. Test workflow migracji przez `workflow_dispatch`

GitHub → **Actions → Migracje produkcji → Run workflow** → gałąź `main`, pole „Tylko podgląd”
**zaznaczone** (domyślnie) → **Run workflow**. Przebieg czeka na zatwierdzenie: **Review deployments** →
zaznacz `production` → **Approve and deploy**.

Kroki workflow: sprawdzenie sekretów, `supabase link --project-ref`, `supabase db push --dry-run`, a
`supabase db push --yes` tylko na pushu do `main` albo przy ręcznym uruchomieniu z odznaczonym „Tylko
podgląd”. Runner GitHuba (`ubuntu-24.04`), nie serwer agentów. Trwającego przebiegu nie anulujesz;
kolejne czekają w jednej kolejce.

Oczekiwany wynik: przed zatwierdzeniem status „Waiting” z prośbą o review; po zatwierdzeniu job zielony,
w kroku „Podgląd migracji (dry run)” komunikat, że baza zdalna jest aktualna („Remote database is up to
date”), bo obie migracje M4 są już w bazie (ADR-005); krok „Migracje produkcji” pominięty (skipped).

Przy błędzie: „Brak sekretów” → krok 10, punkt 3. Błąd logowania (`password authentication failed`,
`Unauthorized`) → popraw sekret w środowisku i **Re-run jobs**. Dry run pokazuje migracje do wykonania,
choć `main` ich nie zmieniał → nie uruchamiaj workflow bez „Tylko podgląd” i zgłoś orkiestratorowi log.
Przebieg z gałęzi innej niż `main` → odrzucony przez regułę środowiska (tak ma być).

Ponowienie po nieudanym przebiegu z pushu (np. zły sekret): popraw przyczynę i **Re-run jobs** tego
przebiegu albo **Run workflow** z odznaczonym „Tylko podgląd”; w obu przypadkach najpierw przeczytaj
wynik dry run w logu.

Od teraz każda nowa migracja w `supabase/migrations/` scalona do `main` uruchamia ten workflow i czeka
na Twoje zatwierdzenie. Aplikacja wdraża się od razu, a migracja po zatwierdzeniu: migracje są zgodne
wstecz (ADR-006 pkt 3).

### 12. Domena `szkolenia.iskt.pl` i rekord CNAME w seohost

1. seohost → panel → **Domeny → iskt.pl → Strefa DNS** (Zarządzanie DNS): zapisz obecne rekordy dla
   nazwy `szkolenia` (typ, wartość, TTL), np. zrzutem ekranu. To dane do rollbacku DNS.
2. Vercel → projekt → **Settings → Domains → Add Domain** → `szkolenia.iskt.pl` → środowisko
   **Production** → **Add**. Vercel pokaże „Invalid Configuration” i wymagany rekord: typ `CNAME`, nazwa
   `szkolenia`, wartość podana przez Vercel w panelu (przepisujesz dokładnie z panelu).
3. seohost → strefa `iskt.pl`: usuń dotychczasowe rekordy `szkolenia` (A albo CNAME do Lovable) i dodaj
   rekord `CNAME`, nazwa `szkolenia`, wartość z punktu 2, TTL najniższy dostępny (np. 300 s). Zapisz.

Oczekiwany wynik: w ciągu kilkunastu minut (do kilku godzin, zależnie od TTL starego rekordu) Vercel →
Domains pokazuje „Valid Configuration” i wystawiony certyfikat. `https://szkolenia.iskt.pl` serwuje stronę
z Vercel z ważnym HTTPS; sprawdzenie w terminalu:

```sh
dig +short szkolenia.iskt.pl CNAME
curl -sI https://szkolenia.iskt.pl
```

`dig` pokazuje wartość z Vercel, a `curl` nagłówek `server: Vercel`.

Przy błędzie: „Invalid Configuration” po kilku godzinach → sprawdź w seohost literówkę w wartości i czy
nie został stary rekord A dla `szkolenia`. Strona nie działa albo błąd certyfikatu dłużej niż godzinę →
„Rollback DNS” niżej.

Po przełączeniu opublikowaną stronę Lovable wyłączasz osobną decyzją (do tego czasu działa jako ścieżka
powrotu DNS).

## Rollback

### Aplikacja (Promote poprzedniego wdrożenia)

Vercel → projekt → **Deployments** → filtr Production → poprzednie działające wdrożenie → **⋯ →
Promote to Production** (albo **Instant Rollback** na karcie produkcji) → potwierdź.

Oczekiwany wynik: domena produkcji serwuje poprzednie wdrożenie w ciągu kilku sekund; Vercel oznacza
bieżące wdrożenie jako „Current”, a automatyczne promowanie nowych wdrożeń z `main` jest wstrzymane do
czasu, aż ręcznie wypromujesz nowsze.

Przy błędzie: brak poprzedniego wdrożenia Production (pierwsze wdrożenie) → rollback DNS. Po naprawie
błędu na `main` wypromuj nowe wdrożenie ręcznie (**Promote to Production**).

Migracji produkcji Promote nie cofa. Migracje są zgodne wstecz, więc poprzednie wdrożenie działa na
nowym schemacie; cofnięcie schematu to nowa migracja przez PR.

### DNS (powrót do Lovable)

seohost → strefa `iskt.pl`: usuń rekord `CNAME szkolenia` i przywróć rekordy zapisane w kroku 12,
punkt 1 (typ, wartość, TTL). Vercel → Domains: domenę możesz zostawić (pokaże „Invalid Configuration”).

Oczekiwany wynik: po czasie TTL `https://szkolenia.iskt.pl` znowu serwuje stronę Lovable (opublikowana
do czasu jej wyłączenia).

Przy błędzie: strona Lovable wyłączona albo bez domeny → zostaje rollback aplikacji w Vercel i
naprawa na `main`; zgłoś orkiestratorowi.
