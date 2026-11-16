# Zlecenie: produkcja na Vercel z bazą w chmurze (cykl M4, krok 1: baza)

Zlecono (UTC): 2026-11-16T10:40Z. Źródło: rozmowa właściciela z orkiestratorem.

Zlecenie 6 z kolejności właściciela (decyzje.md 2026-11-13). Po odbiorze M3 właściciel rozważył
publikację na Lovable, po czym 2026-11-16: „ok, zmieńmy jednak na Vercel. Oczywiście baza danych do
przeniesienia do chmury. Klucze do dodania do Vercel. Robimy to krok po kroku, zacznijmy od bazy
danych”.

Odpowiedzi na paczkę 1 (2026-11-16):

1. „Zostawiamy istniejące konto na Supabase” (projekt vwnvbhiuundeunyzhdxj).
2. „Na razie plan darmowy”.
3. Treści: „Zaczynamy od a” (9 szkoleń z repo, bez fikcyjnych trenerów).
4. „Ja mam konto admina i zapraszam z poziomu Supabase — wystarczy wysyłka przez Supabase na
   razie. To będą 2 osoby”.
5. „Pierwszą produkcję uruchamiam ja, ale kolejne to już automat będzie”.
6. „Przełączymy domenę na Vercel”.

Stan bazy w chmurze (odczyt orkiestratora przez MCP tylko do odczytu, 2026-11-16): tabele
szkolenia, trenerzy, szkolenie_trener puste; 1 konto (właściciel, rola admin, e-mail potwierdzony);
brak historii migracji (`supabase_migrations` pusta).
