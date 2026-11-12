# Szkolenia ISKT

Serwis szkolenia.iskt.pl: publiczna oferta szkoleń ISKT (strona główna, katalog z filtrami, szczegół
szkolenia z ceną i terminami, trenerzy) i panel redakcyjny do zarządzania szkoleniami i trenerami.

## Cel

Projekt powstał w Lovable i jest rozwijany dalej w procesie AI Software House. Pierwszy etap (M1):
serwis i panel działają lokalnie na bazie zbudowanej wyłącznie z plików w repo, z danymi startowymi z
makiet, a zasady dostępu do bazy i cały kod są sprawdzane automatycznie w GitHubie. Działanie serwisu
dla gości i redaktorów się nie zmienia.

Szczegóły: [specyfikacja M1](docs/00-intake/specyfikacja.md), stan wyjściowy:
[raport analizy](docs/00-analiza/raport.md).

## Zakres

- W M1: przejście na pnpm, budowa bazy w migracjach (`supabase/`), dane startowe, uruchomienie
  lokalne z instrukcją, testy zasad dostępu, CI.
- Później, osobnymi zleceniami: zmiany funkcji, wysyłka formularza kontaktu, a na końcu migracja na
  bazę produkcyjną w chmurze i przeniesienie z Lovable na Vercel.
- Produkcja działa dziś na Lovable; publikację w Lovable wykonuje wyłącznie właściciel.

## Uruchomienie lokalne

Instrukcja powstaje w zadaniu W-04 (M1). Zasady pracy agentów: [AGENTS.md](AGENTS.md).
