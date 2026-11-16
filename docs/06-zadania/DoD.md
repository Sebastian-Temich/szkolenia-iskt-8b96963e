---
etap: 06-zadania
status: in-progress
iteracja: 0
akceptacja_wlasciciela: false
---

# DoD: Zadania

## Dokumentacja

- [x] `zadania.yaml` jest kompletny, a `index.md` zsynchronizowany z issue (plik kompletny: `shctl task create --dry-run` kod 0; issue i `index.md` po merge'u przez `shctl task create`)

## Funkcjonalność

- [x] Każdy kamień planu ma zadania z celem i kryteriami akceptacji
- [x] Kryteria każdego zadania z funkcją obejmują podpięcie do punktu wejścia lub routingu (punkty wejścia M5: build, workflow, skrypt i instrukcja; kryteria je sprawdzają)
- [x] Zadania są grube: jedna funkcja albo strona to jedno zadanie
- [-] Zadania z UI wskazują konkretne pliki designu (nie dotyczy: M5 bez zadań z UI)
- [x] Kamienie milowe są założone jako GitHub Milestones (milestone „M5 Produkcja na Vercel” zakłada `shctl task create` po merge'u)

## Checklisty jakości

- [x] Zadania mają kategorię i stack (warstwy skilli workera)
- [-] Zadania z migracją mają `db:migracja` (nie dotyczy: M5 bez migracji)
- [x] Zadania mają rozłączne zakresy plików albo jawną zależność

## Checkpoint

- [ ] Review etapu dało PASS (zaznacza reviewer, nie autor)
