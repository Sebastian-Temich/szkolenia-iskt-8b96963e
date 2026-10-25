# Fundamenty wizualne ISKT Greenovation

## Zakres
- Zastąpić cały design system dostarczonym CSS, zachowując wartości HEX, tokeny i kolejność bloków.
- Załadować Inter i JetBrains Mono przez nagłówek dokumentu; przetłumaczyć komunikaty błędów.
- Dodać tekstowe logo zapasowe, wspólny przyklejony nagłówek z menu mobilnym i stopkę zgodne z podanymi treściami.
- Zastąpić przykładową ofertę oszczędną stroną główną z zatwierdzonym hasłem i trzema wyróżnikami.
- Dodać wyłącznie stronę `/fundamenty` z paletą, typografią, promieniami, cieniami i gradientami.

## Szczegóły techniczne
- Zachować QueryClientProvider, reportLovableError i Outlet; wspólny układ umieścić w istniejącej trasie głównej.
- Linki przyszłych działów pozostawić kotwicami; nie tworzyć katalogu ani tras szkoleń.
- Stosować istniejące komponenty shadcn/ui bez zmian w ich plikach; nie instalować paczek.
- Plik logo nie jest dostępny: nagłówek i stopka użyją dopuszczonego wordmarku zapasowego.
- Zachować dostarczony CSS dosłownie; w elementach strony unikać nakładających się napisów i dekoracyjnych rozmytych kul.

## Weryfikacja
- Uruchomić istniejące testy oraz `bun run lint`; sprawdzić błędy w zmienionych plikach.
- Sprawdzić obie strony, menu mobilne, nagłówek po przewinięciu i wyświetlanie tokenów na komputerze i telefonie.
- Potwierdzić wynik automatycznej kompilacji. Bez publikacji i bez włączania bazy danych.