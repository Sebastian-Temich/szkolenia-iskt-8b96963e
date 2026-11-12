# Decyzje projektu

Plik wspólny, aktualizuje orkiestrator. Decyzje workerów przenosi z raportów `T-NR.md`.

| Data | Źródło | Pytanie | Decyzja |
|---|---|---|---|
| 2026-11-12 | orkiestrator | Merge PR #1 (00-analiza) bez CI | repo przejęte nie ma workflow CI; PR zmienia tylko docs/; review PASS dla 985ed79. Cofnięcie: revert commita 55da8d4 na main |
| 2026-11-12 | orkiestrator | Iteracja review 00-analiza (FAIL 1 istotne, potem PASS) poza shctl stage iter | przed merge'em main nie miał docs/00-analiza/DoD.md, stage iter zwracał kod 3; poprawki tylko zgłoszeń review w PR #1. Cofnięcie: nie dotyczy (zapis faktu); propozycja dla systemu: stage iter i escalate dla etapu 00-analiza przed merge'em |
| 2026-11-12 | wlasciciel | Odczyt bazy Supabase w chmurze przez MCP, tylko zapytania odczytu | zgoda właściciela 2026-11-12 zamiast zrzutu schematu; źródło pierwszej migracji w M1. Cofnięcie: właściciel odłącza MCP Supabase |
| 2026-11-12 | wlasciciel | Produkcja Lovable korzysta z pustej bazy w chmurze; stan przyjęty, treści trafią do nowej bazy przy przenosinach | odpowiedź właściciela 1 na pytania analizy, 2026-11-12. Cofnięcie: decyzja właściciela o wypełnieniu obecnej bazy |
| 2026-11-12 | wlasciciel | Przejście z bun na pnpm w adaptacji, z ADR | bun nie działa na serwerze (SIGILL), kontrakt stacku wymaga pnpm; odpowiedź właściciela 2. Cofnięcie: przywrócenie bun.lock i bunfig.toml z historii |
| 2026-11-12 | wlasciciel | Źródłem prawdy bazy są migracje w repo; bazy w chmurze nie zmieniamy do przenosin | odpowiedź właściciela 3. Cofnięcie: decyzja właściciela |
| 2026-11-12 | wlasciciel | Seed lokalny z makiet (9 szkoleń, trenerzy) i lokalne konto testowego redaktora | odpowiedź właściciela 4. Cofnięcie: zmiana seedu w kolejnym zadaniu |
| 2026-11-12 | wlasciciel | Synchronizacja z Lovable zostaje; publikuje tylko właściciel; odłączenie Lovable po przenosinach na Vercel | odpowiedź właściciela 5. Cofnięcie: decyzja właściciela |
| 2026-11-12 | wlasciciel | Wysyłka formularza kontaktu poza M1, osobne zlecenie | odpowiedź właściciela 6; M1 bez danych osobowych. Cofnięcie: nowe zlecenie właściciela |
| 2026-11-12 | wlasciciel | Usunięcie .env i .pomiar w adaptacji; upublicznienie repo po bramce i testach RLS | odpowiedź właściciela 7; klucz w historii to klucz publiczny anon bazy do wygaszenia. Cofnięcie: decyzja właściciela |
| 2026-11-12 | wlasciciel | Akceptacja analizy i kierunku | kto: właściciel w rozmowie 2026-11-12 („akceptuje analize i kierunek”); na co: raport 00-analiza (PR #1) i kamień M1 uruchomienie lokalne; zakres: adaptacja, migracja z chmury tylko odczyt, testy RLS, porządki, upublicznienie po bramce na polecenie. Cofnięcie: polecenie właściciela; adaptacja nie zmienia kodu aplikacji |
| 2026-11-12 | wlasciciel | Upublicznienie repo Sebastian-Temich/szkolenia-iskt-8b96963e | polecenie właściciela 2026-11-12, wcześniej niż po testach RLS (zmienia odpowiedź 7); warunek: bramka bez blokad po merge'u adaptacji (usunięcie .env i .pomiar); klucz anon w historii przyjęty. Cofnięcie: właściciel przywraca widoczność prywatną w ustawieniach repo |
| 2026-11-12 | wlasciciel | Repo upublicznione ręcznie przez właściciela (ustawienia GitHuba), bez shctl adopt upublicznij | CI w repo prywatnym zablokowane przez billing GitHuba; bramka miała jedną blokadę: .env śledzony na main (klucz anon, przyjęty), usuwany w PR #2; gitleaks bez sekretów, bez service_role i danych osobowych. Cofnięcie: właściciel przywraca widoczność prywatną |
| 2026-11-12 | wlasciciel | PR #2 (adaptacja) czeka na poprawkę shctl review dla gałęzi adopt/adaptacja; bez merge'u bez review modelu | wybór właściciela (A); PR zmienia instrukcje i uprawnienia agentów oraz CI, review jest potrzebne. Cofnięcie: decyzja właściciela o merge'u bez review (wariant B) |
