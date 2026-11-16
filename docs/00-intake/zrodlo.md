# Zlecenie: produkcja na Vercel (cykl M5, krok 2)

Zlecono (UTC): 2026-11-16T22:05Z. Źródło: rozmowa właściciela z orkiestratorem.

Kontynuacja zlecenia 6 (decyzje.md 2026-11-16: „zmieńmy jednak na Vercel … klucze do dodania do
Vercel, robimy to krok po kroku”). Krok 1 (baza produkcyjna) odebrany jako M4 („odbieram, idziemy
dalej”, 2026-11-16).

Odpowiedzi na paczkę 1 (2026-11-16):

1. Plan Vercel: „Darmowe konto na razie”.
2. Region fra1: „ok”.
3. Podglądy PR za ochroną Vercel, z bazą produkcyjną, bez klucza Resend: „ok”.
4. Zmienne w Vercel wpisuje właściciel, nowy klucz Resend, odbiorca biuro@iskt.pl: „ok”.
5. DNS: „Domena jest na seohost”.
6. Automatyczne wdrażanie migracji z GitHub Actions z zatwierdzeniem w środowisku „production”
   (sekrety produkcji w GitHub): „ok”.
7. Odłączenie synchronizacji Lovable po uruchomieniu na Vercel: „ok”.
