---
etap: 06-zadania
status: done
iteracja: 0
akceptacja_wlasciciela: false
---

# DoD: Zadania

## Dokumentacja

- [x] `zadania.yaml` jest kompletny, a `index.md` zsynchronizowany z issue (plik kompletny: `shctl task create --dry-run` kod 0; issue #61–#62 i `index.md` założone przez `shctl task create` na `main`)

## Funkcjonalność

- [x] Każdy kamień planu ma zadania z celem i kryteriami akceptacji
- [x] Kryteria każdego zadania z funkcją obejmują podpięcie do punktu wejścia lub routingu (punkty wejścia M4 to skrypty i instrukcja, kryteria T12 je uruchamiają w CI)
- [x] Zadania są grube: jedna funkcja albo strona to jedno zadanie
- [-] Zadania z UI wskazują konkretne pliki designu (nie dotyczy: M4 bez zadań z UI)
- [x] Kamienie milowe są założone jako GitHub Milestones (milestone „M4 Baza produkcyjna” zakłada `shctl task create` po merge'u)

## Checklisty jakości

- [x] Zadania mają kategorię i stack (warstwy skilli workera)
- [x] Zadania z migracją mają `db:migracja`
- [x] Zadania mają rozłączne zakresy plików albo jawną zależność

## Checkpoint

- [x] Review etapu dało PASS (zaznacza reviewer, nie autor) — PR #60, commit ac8a582
