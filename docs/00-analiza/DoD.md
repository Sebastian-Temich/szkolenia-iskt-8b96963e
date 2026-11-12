---
etap: 00-analiza
status: review
iteracja: 0
akceptacja_wlasciciela: true
---

# DoD: Analiza przejętego projektu

## Dokumentacja

- [x] `raport.md` ma część „Dla właściciela” na górze: stan w jednym akapicie, co działa, czego brakuje, ryzyka, pytania paczką z propozycjami, proponowany pierwszy kamień milowy
- [x] `raport.md` ma część „Dla wykonawcy”: stack i zależności (przestarzałe i podatne), architektura obecna, testy i CI, wdrożenie, integracje, nazwy zmiennych środowiskowych bez wartości, dług techniczny
- [x] Każda funkcja użytkowa ma kartę w stanie obecnym `funkcje/F-NN.md`, a mapa funkcji w raporcie do nich linkuje
- [x] Analiza zmieściła się w `adopt.limit_analizy_min` albo raport ma sekcję „Nie przeanalizowano”

## Funkcjonalność

- [x] Stan wyjściowy testów i CI jest zapisany (które testy są zielone na `main`)
- [x] Wynik `scripts/adopt/wykryj.sh` jest w raporcie: Lovable, Supabase, klucze, pliki env, RLS, dane osobowe
- [x] Klient Supabase: klucz w kodzie albo w env i jego rola (anon, service_role); `service_role` w repo jest alarmem 🔴
- [x] Przegląd RLS według `sh-kat-baza` dla każdej tabeli z migracji (repo nie ma migracji: przegląd polityk w chmurze przez MCP, tylko odczyt)
- [x] Zgodność migracji ze schematem w chmurze: wynik porównania ze zrzutem od właściciela albo pytanie o zrzut; przy rozjeździe propozycja migracji wyrównującej

## Checklisty jakości

- [x] Brak wartości sekretów, kluczy i danych osobowych w raporcie i kartach
- [x] Część „Dla właściciela” bez kodów, nazw plików i backticków; pytania mają proponowane odpowiedzi
- [x] Analiza nie zmieniła kodu aplikacji, konfiguracji chmury ani widoczności repo

## Checkpoint

- [x] Review etapu dało PASS (zaznacza reviewer, nie autor) — PR #1, commit 985ed79
- [x] Właściciel napisał „akceptuję analizę i kierunek” (2026-11-12, decyzje.md)
