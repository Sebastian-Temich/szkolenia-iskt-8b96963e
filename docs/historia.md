# Historia projektu

Punkt przekazania wpisuje orkiestrator po kamieniu milowym, dziennik etapów `shctl stage`, a listę
zadań `scripts/sync-status.sh`.

## Punkt przekazania

2026-11-13T00:45Z (UTC). Kamień M1 „Uruchomienie lokalne”: wszystkie zadania zamknięte — #6 pnpm
i CI (PR #11), #7 migracja bazowa 1:1 z chmurą (PR #12), #8 dane startowe i README (PR #13, 2
iteracje), #9 testy RLS pgTAP (PR #14, 2 iteracje), #10 dokumentacja wydania (PR #15). Na `main`:
230 testów vitest zielonych; `shctl db reset` z migracji i seedu, `shctl db test` 119/119. Stack
`shctl db` działa (porty 55421–55429), `.env.local` w głównej kopii wskazuje bazę lokalną,
`node_modules` zainstalowane. Serwer `pnpm dev` nie uruchomiony: sandbox orkiestratora blokuje
nasłuch na porcie (`listen EPERM`) i połączenia z 127.0.0.1. Eskalacje: brak. Wstrzymania: brak.
`shctl doctor` 2026-11-12T23:01Z: 0 błędów. Autoryzacja: „Autoryzacja planu PR #4”. Następny krok:
właściciel uruchamia `pnpm dev` (README, „Uruchomienie lokalne”), potem QA kamienia M1 (08-qa) i
odbiór.

## Dziennik etapów

- 2026-11-12 `00-analiza`: review
- 2026-11-12 `00-intake`: in-progress
- 2026-11-12 `00-intake`: review
- 2026-11-12 `00-intake`: done
- 2026-11-13 `04-plan`: in-progress
- 2026-11-13 `04-plan`: review
- 2026-11-13 `04-plan`: done
- 2026-11-13 `06-zadania`: in-progress
- 2026-11-13 `06-zadania`: review
- 2026-11-13 `06-zadania`: iteracja 2 (FAIL review PR #5)
- 2026-11-13 `06-zadania`: done
- 2026-11-13 `08-qa`: in-progress
- 2026-11-13 `08-qa`: review
- 2026-11-13 `08-qa`: done
- 2026-11-13 `wydanie`: in-progress
- 2026-11-13 `wydanie`: review

<!-- historia:start -->
<!-- Blok generuje scripts/sync-status.sh. Nie edytuj go ręcznie. -->

## Wszystkie zadania zrobione (5)

| Zadanie | Kamień | PR | Zamknięte |
|---|---|---|---|
| #10 Dokumentacja wydania M1 i regresja | M1 Uruchomienie lokalne | #15 | 2026-11-13 |
| #9 Testy zasad dostępu (pgTAP) | M1 Uruchomienie lokalne | #14 | 2026-11-13 |
| #8 Dane startowe, konta testowe i uruchomienie lokalne z instrukcją | M1 Uruchomienie lokalne | #13 | 2026-11-13 |
| #7 Migracja bazowa 1:1 z chmurą i job bazy w CI | M1 Uruchomienie lokalne | #12 | 2026-11-12 |
| #6 Przejście z bun na pnpm i CI jakości | M1 Uruchomienie lokalne | #11 | 2026-11-12 |
<!-- historia:end -->
