---
etap: 06-zadania
status: done
iteracja: 0
akceptacja_wlasciciela: false
---

# DoD: Zadania

## Dokumentacja

- [x] `zadania.yaml` jest kompletny, a `index.md` zsynchronizowany z issue (plik kompletny: `shctl task create --dry-run` kod 0; issue #46–#48 i `index.md` założone przez `shctl task create` na `main`)

## Funkcjonalność

- [x] Każdy kamień planu ma zadania z celem i kryteriami akceptacji
- [x] Kryteria każdego zadania z funkcją obejmują podpięcie do punktu wejścia lub routingu
- [x] Zadania są grube: jedna funkcja albo strona to jedno zadanie
- [x] Zadania z UI wskazują konkretne pliki designu
- [x] Kamienie milowe są założone jako GitHub Milestones (milestone „M3 Wysyłka zgłoszeń” zakłada `shctl task create` po merge'u)

## Checklisty jakości

- [x] Zadania mają kategorię i stack (warstwy skilli workera)
- [-] Zadania z migracją mają `db:migracja` (nie dotyczy: M3 bez migracji)
- [x] Zadania mają rozłączne zakresy plików albo jawną zależność

## Checkpoint

- [x] Review etapu dało PASS (zaznacza reviewer, nie autor) — PR #45, commit b2ff403
