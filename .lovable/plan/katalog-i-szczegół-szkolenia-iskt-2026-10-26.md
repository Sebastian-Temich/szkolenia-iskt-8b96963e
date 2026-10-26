# Katalog i szczegół szkolenia ISKT

## Zakres
- Dodać `/szkolenia` z dziewięcioma zatwierdzonymi szkoleniami, filtrami kategorii, wyszukiwaniem i poprawną odmianą liczby wyników.
- Dodać `/szkolenia/$id` z programem, efektami nauki, odbiorcami, ceną i dokładnie podanymi terminami.
- Zachować teksty i ceny bez zmian. Pokazywać cenę z dofinansowaniem oraz pełną cenę za pomocą wspólnego bloku ceny.
- Uwzględnić szkielety ładowania, pusty wynik, błąd z ponowieniem i 404; oba przyciski szczegółu kierują tymczasowo do `/`.
- Zmienić wyłącznie odnośnik „Katalog” w nagłówku. Strona główna, stopka, logo, wspólny układ i CSS pozostają nietknięte.

## Szczegóły techniczne
- Warstwa `src/lib/szkolenia/` obejmuje pięć wskazanych plików: `typy`, `mock-dane`, `filtrowanie`, `adapter`, `cena` (opis mówi o czterech, ale wymienia pięć).
- Tylko adapter importuje mocki; udostępnia widokom również typy, kategorie oraz czyste pomocnicze funkcje filtrowania i ceny, aby zachować jeden punkt podmiany.
- Stan filtrów przechowywać w URL; wyszukiwanie aktualizować po 300 ms bez dopisywania historii. Nie dodawać zależności; walidację parametrów wykonać bez dodatkowego adaptera Zod.
- Dane ładować w loaderach tras; demonstracyjne opóźnienia i błędy pozostają wyłącznie w warstwie mock.
- Stosować istniejące shadcn/ui, lucide-react i tokeny marki. Każda nowa trasa otrzyma własny tytuł i opis oraz metadane udostępniania.
- Dodać wymagany skrypt `typecheck: tsc --noEmit`; kontrolę typów wykonuje automatyczna weryfikacja projektu, bez ręcznego uruchamiania kompilatora.
- Bez bazy, klienta usług, zmiennych środowiskowych, formularzy, publikacji i nowych paczek.

## Weryfikacja
- Dodać szybkie testy danych z fałszywymi zegarami: ceny, separator U+202F, filtrowanie, odmiana, integralność dziewięciu pozycji, pobranie i terminy.
- Uruchomić `bun run test` i `bun run lint`; sprawdzić wynik automatycznej kontroli typów i kompilacji.
- Sprawdzić katalog → filtr → wyszukiwanie → szczegół → powrót oraz stany puste, błędne, ładowanie i 404 na komputerze i telefonie.
- Podać utworzone i zmienione pliki oraz rzeczywiste wyniki poleceń; nie przedstawiać automatycznej kontroli jako ręcznego uruchomienia `bun run typecheck`.