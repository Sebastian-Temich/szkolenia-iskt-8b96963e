# Specyfikacja: szkolenia-iskt, cykl M2-bezpieczenstwo

Zlecenie: `docs/00-intake/zrodlo.md`. Zlecono (UTC): 2026-11-13T19:35Z.

Cykl M2 opisuje zmianę względem stanu po M1 (archiwum `docs/cykle/M1/`: specyfikacja, plan, ADR
w `docs/04-plan/adr/`, schemat chmury `docs/cykle/M1/04-plan/schemat-chmury.md`). Numeracja wymagań idzie
dalej przez projekt: M1 miało W-01…W-07, M2 ma W-08…W-11.

## Cel i kontekst

Kontrola bezpieczeństwa i wydajności Supabase (advisor, przegląd w analizie i w M1) zgłosiła dla
budowy bazy przeniesionej 1:1 z chmury: funkcje sprawdzające role są wywoływalne przez
niezalogowanych gości (0028/0029), tabele mają po dwie permisywne zasady odczytu dla zalogowanych
(0006), a konfiguracja logowania lokalnie wskazuje zły adres serwisu i ma słabe wymagania haseł. M1
świadomie zostawił to bez zmian (ADR-001, Z4). M2 poprawia to nowymi migracjami w repo, zanim baza z
migracji stanie się produkcją (zlecenie przenosin).

Rezultat: goście nie wywołują funkcji ról, każda tabela ma jedną zasadę odczytu na rolę, logowanie
lokalne ma poprawny adres i rozsądne wymagania haseł, a testy zasad dostępu potwierdzają, że nikt nie
widzi i nie zapisuje więcej ani mniej niż dziś.

## Użytkownicy

| Grupa | Potrzeba | Uprawnienia |
|---|---|---|
| Gość serwisu (anon) | Oferta i trenerzy jak dziś | Odczyt opublikowanych treści; bez wywołań funkcji ról |
| Redaktor / administrator (authenticated z rolą) | Panel jak dziś | Odczyt wszystkiego i zapis przez rolę |
| Zalogowany bez roli | — | Odczyt opublikowanych treści, ekran „Brak uprawnień” w panelu |
| Właściciel | Bezpieczna baza do przenosin | — |

## Zakres

W zakresie:

- nowa migracja: odebranie `EXECUTE` funkcji `is_staff`, `is_admin`, `moje_role` rolom `anon` i
  `PUBLIC` (zostaje dla `authenticated` i `service_role`);
- nowa migracja: zastąpienie par zasad odczytu (`*_select_publiczne` + `*_select_staff`) jedną
  zasadą na rolę dla `szkolenia`, `trenerzy`, `szkolenie_trener`, z identycznym zbiorem widocznych
  wierszy;
- `supabase/config.toml`: `site_url` i `additional_redirect_urls` na adres `pnpm dev`
  (`http://localhost:8080`), wymagania haseł lokalnie;
- testy pgTAP: aktualizacja `schemat_chmury.test.sql` o udokumentowane różnice względem chmury i
  rozszerzenie testów RLS o nowe zachowanie.

Poza zakresem:

- ochrona przed hasłami, które wyciekły (HIBP) — tylko w Supabase w chmurze, włączana w zleceniu
  przenosin;
- jakiekolwiek zmiany w obecnej bazie w chmurze i publikacja w Lovable;
- zmiany ekranów i kodu aplikacji (chyba że wymusi je W-08 — patrz Z2);
- funkcja platformy `rls_auto_enable` (nie jest w migracjach);
- poprawki dostępności z #20 i aktualizacje paczek (osobne zlecenia S).

## Wymagania

### W-08: Goście nie wywołują funkcji ról (musi) (bez karty: zmiana uprawnień w bazie)

Jako właściciel chcę, aby niezalogowany gość nie mógł wywołać funkcji ról, aby zmniejszyć
powierzchnię ataku API.

- W-08/K1: Given rola `anon`, when wywołuje `is_staff()`, `is_admin()` albo `moje_role()`, then baza
  odmawia (`42501`) (pgTAP).
- W-08/K2: Given zalogowany redaktor, administrator i konto bez roli, when wywołują te funkcje, then
  wynik jest taki sam jak przed zmianą (pgTAP, testy `rls_funkcje_rol`).
- W-08/K3: Given serwis i panel, when gość ogląda strony publiczne, a redaktor loguje się do panelu,
  then działają jak dziś: 230+ testów vitest i testy E2E zielone (panel woła funkcje ról tylko po
  zalogowaniu).

### W-09: Jedna zasada odczytu na rolę (powinno) (bez karty: zmiana zasad dostępu)

Jako właściciel chcę jednej zasady odczytu na rolę dla każdej tabeli treści, aby usunąć uwagę
wydajnościową i uprościć zasady, bez zmiany tego, kto co widzi.

- W-09/K1: Given tabele `szkolenia`, `trenerzy`, `szkolenie_trener`, when advisor wydajności (`db
  advisors`), then brak `0006_multiple_permissive_policies` (job CI `baza`).
- W-09/K2: Given szkice i opublikowane treści, when czytają anon, zalogowany bez roli, redaktor,
  administrator, then widoczne wiersze są identyczne jak przed zmianą (pgTAP: istniejące testy
  `rls_odczyt_szkicow`, `rls_redakcja` bez zmian oczekiwań).
- W-09/K3: Given zasada dla `anon`, when jest oceniana, then nie wywołuje `is_staff()` (W-08 odbiera
  gościom EXECUTE) (przegląd migracji i test anon).

### W-10: Konfiguracja logowania lokalnie (powinno) (bez karty: konfiguracja)

Jako właściciel chcę, aby linki z e-maili logowania lokalnie prowadziły do serwisu, a hasła miały
sensowne wymagania, aby konfiguracja była gotowa do przeniesienia na produkcję.

- W-10/K1: Given `supabase/config.toml`, when przegląd, then `site_url = "http://localhost:8080"`,
  `additional_redirect_urls` zawiera `http://localhost:8080` i `http://127.0.0.1:8080`.
- W-10/K2: Given konfiguracja haseł, when przegląd, then `minimum_password_length` ≥ 8 i
  `password_requirements = "lower_upper_letters_digits"`; konta testowe z seedu działają (hasła
  testowe dostosowane, README i testy E2E zaktualizowane) — patrz Z1.
- W-10/K3: Given `shctl db start` i `db reset`, when uruchomienie, then stack działa, seed przechodzi.

### W-11: Testy i regresja (musi) (bez karty: testy)

Jako właściciel chcę, aby testy potwierdzały nowe zasady i brak regresji.

- W-11/K1: `schemat_chmury.test.sql` (od M2: zgodność z chmurą plus udokumentowane różnice) zawiera
  różnice W-08 i W-09 jako oczekiwane, z komentarzem i odwołaniem do ADR.
- W-11/K2: `shctl db test` i job CI `baza` zielone; job `e2e` i `jakosc` zielone.
- W-11/K3: Migracje zgodne wstecz: aplikacja bez zmian działa na nowym schemacie.

## Karty funkcji

Brak funkcji użytkowych: wszystkie wymagania to zmiany bazy, konfiguracji i testów (powód w
nagłówkach). Zachowanie widoczne dla gościa i redaktora się nie zmienia (karty stanu obecnego
F-01…F-08 w `docs/00-analiza/funkcje/`).

## Lista startowa

`docs/00-intake/lista-startowa.md`: wszystkie pozycje „nie dotyczy”.

## Typ projektu

Web (bez zmian względem M1).

| Konsekwencja | Ustalenie |
|---|---|
| Narzędzia testowe | pgTAP (`shctl db test`, job `baza`), vitest, Playwright E2E (job `e2e`, od #20) |
| Dodatkowe punkty DoD | Zbiór widocznych wierszy bez zmian (W-09/K2); udokumentowane różnice wobec chmury (W-11/K1) |
| Ograniczenia runnera | Jak w M1: baza przez `shctl db` poza sandboksem workera, jeden stack naraz |
| Kroki ręczne właściciela | Checkpointy specyfikacji i planu, odbiór |

## Stack

| | Wybór | Uzasadnienie |
|---|---|---|
| Rekomendacja | Bez zmian (AGENTS.md); nowe migracje w `supabase/migrations/` | Zmiana tylko zasad i uprawnień |
| Alternatywa | Zmiany po przenosinach, w nowym projekcie Supabase | Odrzucona: produkcja powstanie z migracji, więc poprawki powinny w nich być wcześniej |

## Hosting

Bez zmian: M2 działa lokalnie; hosting docelowy zaakceptowany w M1 (`docs/konfiguracja.md`).

## Design

Bez zmian ekranów. Właściciel nic nie dostarcza.

## Kroki ręczne właściciela

1. Checkpoint specyfikacji i planu.
2. Odbiór M2 (bez zmian widocznych; serwis i panel działają jak dziś).

## Ryzyka

| Obszar | Ocena (tak, nie, do ustalenia) | Skutek |
|---|---|---|
| Auth i RLS, role użytkowników | tak | ADR w 04-plan: „Uprawnienia funkcji ról i jedna zasada odczytu na rolę”. Wiadomo: polityki i ACL z `schemat-chmury.md` (archiwum M1), testy RLS z M1; zasada dla `anon` nie może wołać `is_staff()` po odebraniu EXECUTE. Plan rozstrzyga: kształt zasad (osobna dla anon i authenticated vs warunek z `auth.role()`), sposób aktualizacji testu zgodności z chmurą, dowody pozytywne i negatywne dla 4 ról |
| Płatności | nie | — |
| Dane osobowe | nie | — |
| AI przetwarzające dane użytkowników | nie | — |
| Migracje bazy produkcyjnej | nie | Bazy w chmurze nie zmieniamy; migracje trafią na produkcję w zleceniu przenosin |
| Upload plików, integracje zewnętrzne | nie | — |
| Płatne usługi, sekrety, nowe konta | nie | — |

## Szacunek poglądowy

| Miara | Wartość |
|---|---|
| Zadania | 2–3 (migracje uprawnień i zasad z testami; konfiguracja logowania z seedem, README i E2E) |
| Czas kalendarzowy | kilka godzin pracy agentów po akceptacji planu |
| Czas właściciela | ok. 15 min: dwa checkpointy i odbiór |

## Tryb procesu

Tryb M: zlecenie zmienia zasady dostępu i uprawnienia w bazie (obszar ryzyka), więc wymaga planu z
ADR; kolejny cykl M2 (`shctl cykl new`). Zlecono 2026-11-13T19:35Z.

## Do potwierdzenia

| Nr | Karta | Pytanie albo założenie | Proponowana odpowiedź | Źródło (zdecyduj sam, luka bez pytania) |
|---|---|---|---|---|
| Z1 | — | Hasła kont testowych po zaostrzeniu wymagań (W-10/K2) | Nowe hasła testowe spełniające wymagania (np. `Redaktor-lokalnie1`), tylko lokalnie, zaktualizowane w seedzie, README i testach E2E | luka bez pytania |
| Z2 | — | Czy W-08 wymaga zmian w kodzie panelu | Nie: panel woła `moje_role()`/`is_staff()` tylko z sesją; jeśli testy wykażą inaczej, minimalna poprawka w `src/lib/panel/sesja.ts` w tym samym zadaniu | luka bez pytania |
| Z3 | — | Kształt zasady odczytu dla `authenticated` | Jedna zasada `status = 'published' OR is_staff()` dla `authenticated` i osobna `status = 'published'` dla `anon`; ostateczny kształt w ADR | luka bez pytania |
