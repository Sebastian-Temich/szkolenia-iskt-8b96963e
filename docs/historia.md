# Historia projektu

Punkt przekazania wpisuje orkiestrator po kamieniu milowym, dziennik etapów `shctl stage`, a listę
zadań `scripts/sync-status.sh`.

## Punkt przekazania

2026-11-13T00:30Z (UTC). Kamień M1 „Uruchomienie lokalne” startuje: specyfikacja (PR #3) i plan
(PR #4) zaakceptowane, zadania #6–#10 (T1–T5) założone. Praca nocna z delegacji właściciela
(`decyzje.md`, 2026-11-13). Zadania w toku: brak; następny dispatch #6 (T1). Eskalacje: brak.
Wstrzymania: brak. `shctl doctor` 2026-11-12T23:01Z: 0 błędów (Docker, herdr, logowania OK).
Autoryzacja: wiersz „Autoryzacja planu PR #4” w `decyzje.md`. Następny krok: realizacja T1→T5
kolejno, potem uruchomienie serwisu z lokalną bazą dla właściciela.

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

<!-- historia:start -->
<!-- Blok generuje scripts/sync-status.sh. Nie edytuj go ręcznie. -->

## Wszystkie zadania zrobione (4)

| Zadanie | Kamień | PR | Zamknięte |
|---|---|---|---|
| #9 Testy zasad dostępu (pgTAP) | M1 Uruchomienie lokalne | #14 | 2026-11-13 |
| #8 Dane startowe, konta testowe i uruchomienie lokalne z instrukcją | M1 Uruchomienie lokalne | #13 | 2026-11-13 |
| #7 Migracja bazowa 1:1 z chmurą i job bazy w CI | M1 Uruchomienie lokalne | #12 | 2026-11-12 |
| #6 Przejście z bun na pnpm i CI jakości | M1 Uruchomienie lokalne | #11 | 2026-11-12 |
<!-- historia:end -->
