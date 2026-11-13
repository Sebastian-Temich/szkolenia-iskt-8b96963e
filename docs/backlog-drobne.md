# Backlog drobnych uwag

Plik wspólny, aktualizuje orkiestrator. Zgłoszenia ⚪ z review i „Drobne uwagi” z raportów.

| Data | Źródło | Uwaga | Stan |
|---|---|---|---|
| 2026-11-13 | T-6 | `README.md` i `.lovable/plan/…` mogą wspominać bun; poza zakresem (README w zadaniu M1). | otwarta |
| 2026-11-13 | T-6 | Build ostrzega, że `vite-tsconfig-paths` jest zbędny przy natywnym `resolve.tsconfigPaths` (stan wyjściowy). | otwarta |
| 2026-11-13 | T-6 | Przestarzałe paczki: `eslint@9.39.5` (deprecated), `recharts@2.15.4` (deprecated) oraz pośrednie `abab`, `domexception`, `tsconfck`, `whatwg-encoding`; poza zakresem (aktualizacje paczek). | otwarta |
| 2026-11-13 | T-6 | pnpm 12 wypisuje „Agent skills awaiting approval: @tanstack/react-start, @tanstack/router-plugin. Run "pnpm approve"”: nie zatwierdzałem; nie wpływa na instalację ani testy. | otwarta |
| 2026-11-13 | T-7 | `shctl db` w kopii roboczej (`/Users/Shared/sh/stan/db/szkolenia-iskt`) zapisuje sekcję `[inbucket]`, więc CLI 2.121.0 ostrzega „config section [inbucket] is deprecated”. To nie jest plik repo. W CLI 3.x ta sekcja będzie błędem. | otwarta |
| 2026-11-13 | T-7 | Ostrzeżenie „no files matched pattern: supabase/seed.sql” zniknie po T3 (seed). | otwarta |
| 2026-11-13 | T-8 | `site_url` w `supabase/config.toml` to `http://127.0.0.1:3000`, a `pnpm dev` serwuje port 8080. Logowanie hasłem tego nie używa, ale linki z e-maili auth (reset hasła) wskazywałyby zły adres. Poza zakresem (plik spoza listy, porty bloku). | otwarta |
| 2026-11-13 | T-8 | `shctl db reset` ostrzega „config section [inbucket] is deprecated” (kopia robocza shctl, jak w T-7). | otwarta |
| 2026-11-13 | T-9 | `shctl db` ostrzega „config section [inbucket] is deprecated” (jak w T-7 i T-8). | otwarta |
| 2026-11-13 | T-9 | Advisor 0028/0029 (`anon` wywołuje `is_staff`, `is_admin`, `moje_role` jako `security definer`) zostaje 1:1 z chmurą (ADR-001 pkt 4); testy K4 potwierdzają, że funkcje te nie ujawniają cudzych ról. | otwarta |
