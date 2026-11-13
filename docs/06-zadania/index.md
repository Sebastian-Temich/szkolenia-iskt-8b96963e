# Zadania

Plik wspólny. Tabelę generuje `scripts/sync-status.sh`, nie edytuj jej ręcznie.

<!-- sync-status:start -->
| Zadanie | Tytuł | Status | Iteracja | Kamień milowy | PR | CI |
|---|---|---|---|---|---|---|
| #6 | Przejście z bun na pnpm i CI jakości | done | 1 | M1 Uruchomienie lokalne | #11 merged | pass |
| #7 | Migracja bazowa 1:1 z chmurą i job bazy w CI | done | 1 | M1 Uruchomienie lokalne | #12 merged | pass |
| #8 | Dane startowe, konta testowe i uruchomienie lokalne z instrukcją | done | 2 | M1 Uruchomienie lokalne | #13 merged | pass |
| #9 | Testy zasad dostępu (pgTAP) | done | 2 | M1 Uruchomienie lokalne | #14 merged | pass |
| #10 | Dokumentacja wydania M1 i regresja | done | 1 | M1 Uruchomienie lokalne | #15 merged | pass |
| #18 | Okno zapisu z nazwą szkolenia na stronie szkolenia | review | 2 | - | #19 open | pass |
<!-- sync-status:end -->

## Mapa zadań z planu

Sekcję uzupełnia `shctl task create`: ID z pliku YAML i numer issue.

<!-- shctl:mapa:start -->
| ID | Issue | Tytuł | Zależności |
|---|---|---|---|
| T1 | #6 | Przejście z bun na pnpm i CI jakości | - |
| T2 | #7 | Migracja bazowa 1:1 z chmurą i job bazy w CI | #6 |
| T3 | #8 | Dane startowe, konta testowe i uruchomienie lokalne z instrukcją | #7 |
| T4 | #9 | Testy zasad dostępu (pgTAP) | #8 |
| T5 | #10 | Dokumentacja wydania M1 i regresja | #6, #7, #8, #9 |
| S-20261113-okno-zapisu | #18 | Okno zapisu z nazwą szkolenia na stronie szkolenia | - |
<!-- shctl:mapa:end -->
