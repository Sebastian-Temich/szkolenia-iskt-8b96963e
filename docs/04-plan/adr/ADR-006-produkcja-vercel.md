# ADR-006: Produkcja na Vercel, automatyczne wdrożenia i migracje z zatwierdzeniem

Status: proponowana
Data: 2026-11-16

## Kontekst

Cykl M5 (`docs/00-intake/specyfikacja.md`, W-18…W-22). Baza produkcyjna działa (M4, ADR-005). Build
zależy od `@lovable.dev/vite-tanstack-config` (nitro, preset `cloudflare-module`). Właściciel wybrał
Vercel Hobby, region fra1, podglądy PR za ochroną z bazą produkcyjną bez klucza Resend, automatyczne
wdrażanie migracji po zatwierdzeniu, DNS w seohost i odłączenie Lovable (decyzje.md 2026-11-16, Z1–Z4).
Obszary ryzyka: dane osobowe, migracje produkcji, integracje, sekrety.

## Decyzja

1. **Build bez Lovable.** `vite.config.ts` z `defineConfig` z `vite`: wtyczki `tanstackStart`
   (z `server.entry: "server"`), `nitro` (preset `vercel`, region fra1), `@vitejs/plugin-react`,
   `@tailwindcss/vite`, `resolve.tsconfigPaths: true` (bez `vite-tsconfig-paths`), alias `@`,
   wtyczka naprawy komentarza w `styles.css` bez zmian. Usunięcie `@lovable.dev/vite-tanstack-config`
   z zależności. Zachowane zachowania z konfiguracji Lovable, których aplikacja potrzebuje
   (wstrzyknięcie `VITE_*`, dedupe React/TanStack); devtools tylko w dev. `pnpm dev` na porcie 8080.
2. **Wdrażanie aplikacji (Z1).** Integracja Git Vercel: `main` → Production, PR → Preview.
   Wycofanie: „Promote to Production” poprzedniego wdrożenia w Vercel (instrukcja). Zmienia zasadę z
   AGENTS.md „produkcję wdraża wyłącznie właściciel przez deploy-prod.sh”: produkcję aplikacji wdraża
   merge do `main` po review i zielonym CI; `scripts/deploy-prod.sh` przestaje być ścieżką aplikacji.
3. **Kolejność aplikacja–migracja.** Migracje zgodne wstecz (expand/contract, AGENTS.md): kod z `main`
   musi działać na schemacie sprzed migracji, bo aplikacja wdraża się od razu, a migracja po
   zatwierdzeniu. Kod zależny od nowej kolumny trafia w kolejnym PR po wdrożeniu migracji.
4. **Zmienne (W-19, W-20).** Production: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   (projekt vwnvbhiuundeunyzhdxj), `RESEND_API_KEY` (nowy klucz), `ZGLOSZENIA_ODBIORCA`,
   `ZGLOSZENIA_NADAWCA`, `ZGLOSZENIA_NAGLOWEK_IP=x-vercel-forwarded-for`. Preview: te same bez
   `RESEND_API_KEY` (formularz w stanie błędu). Wpisuje właściciel; w repo tylko nazwy.
5. **Podglądy (W-20).** Vercel Deployment Protection: „Standard Protection” (podglądy tylko dla
   zalogowanych do Vercel). Ryzyko: panel na podglądzie zmienia dane produkcji (ta sama baza);
   ograniczenie: logowanie do panelu tylko kontami redakcji, a zmiany w panelu na podglądzie traktujemy
   jak zmiany produkcji (instrukcja).
6. **Migracje (W-21, Z4).** Workflow `.github/workflows/migracje-produkcja.yml`: wyzwalacz push na
   `main` ze zmianą w `supabase/migrations/**` oraz ręczny `workflow_dispatch`; job w środowisku
   GitHub `production` (wymagany reviewer: właściciel); kroki: `supabase link --project-ref` z
   `SUPABASE_PROJECT_ID`, `supabase db push --dry-run`, `supabase db push`. Sekrety
   `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` tylko w środowisku
   `production`; brak `pull_request_target`; uprawnienia `contents: read`. Zmienia zasadę „brak
   poświadczeń produkcji w GitHub” (AGENTS.md): wyjątek ograniczony do tego środowiska.
7. **Domena (W-22, Z2).** Najpierw `*.vercel.app` i sprawdzenie, potem domena w Vercel i rekord
   CNAME `szkolenia` → wartość wskazana przez Vercel w panelu seohost, potem odłączenie Lovable
   (GitHub → Lovable). Wycofanie DNS: przywrócenie poprzedniego rekordu.
8. **Limit zgłoszeń (Z3).** W pamięci per instancja (ADR-004), trwały licznik później.

## Konsekwencje

- Lovable przestaje budować projekt (konfiguracja usunięta); odłączenie w W-22.
- Plan Hobby: ryzyko regulaminu (strona komercyjna) po stronie właściciela.
- AGENTS.md: sekcje Lovable i Sekrety aktualizowane w planie.
