# E01/F — część 1

Nanieść dostarczoną łatkę w wymienionych 14 plikach i utworzyć wyłącznie pomocnik `powrot.ts`. Zachować polskie komentarze i jawne sekwencje Unicode.

- Poprawić kontrast tekstu, usunąć martwą pozycję trenerów i ustawić cele stopki.
- Dodać nierozdzielającą spację przed zł, warunkową kartę dofinansowania i mapowanie kategorii po identyfikatorze.
- Zachować filtry w przejściu katalog–szczegół–katalog oraz nanieść wyłącznie podane zmiany testów i skryptu E2E.
- Uruchomić istniejące testy i lint; nie uruchamiać Playwrighta. Podać pełne wyniki, listę plików i SHA bazowe.

## Ograniczenia techniczne

- Bez zmian CSS, zależności, bazy, sekretów i publikacji; bez części 2.
- Środowisko zabrania ręcznego uruchamiania kontroli typów: zamiast `bun run typecheck` podać wynik automatycznej kontroli, bez udawania wykonania komendy.
- W nowej karcie użyć istniejącego tokenu bieli zamiast `text-white` i `bg-white`, zgodnie z nadrzędną zasadą tokenów. Pozostała łatka bez zmian.
- Dopisać regułę nowego pomocnika w AGENTS.md i zakres w roadmap.md, wymagane przez środowisko.