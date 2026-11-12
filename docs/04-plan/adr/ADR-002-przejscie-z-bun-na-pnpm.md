# ADR-002: Przejście z bun na pnpm

Status: proponowana
Data: 2026-11-13

## Kontekst

Projekt z Lovable używa bun (`bun.lock`, `bunfig.toml` z `minimumReleaseAge = 86400` i wyjątkami dla
paczek `@lovable.dev/*`). Na serwerze bun nie działa (SIGILL także w wariancie baseline, raport
analizy „Testy i CI”). Kontrakt stacku procesu dopuszcza wyłącznie pnpm. Właściciel zdecydował o
przejściu 2026-11-12 (`decyzje.md`). Stan wyjściowy z npm: 230 testów zielonych, typy i build OK.

## Decyzja

1. pnpm (wersja w `packageManager` w `package.json`), lock `pnpm-lock.yaml` utworzony z zakresów
   `package.json` (pnpm nie importuje `bun.lock`); usunąć `bun.lock` i `bunfig.toml`.
2. `pnpm-workspace.yaml`: `minimumReleaseAge: 1440` (minuty, odpowiednik doby z bunfig) z
   `minimumReleaseAgeExclude` dla tych samych paczek `@lovable.dev/*`; `allowBuilds` tylko dla paczek
   z natywnymi binarkami, które tego wymagają (sprawdzone przy instalacji: esbuild/rolldown, jeśli
   pnpm o nie pyta).
3. `overrides` z `package.json` (`rolldown: 1.2.1`) przenieść do `pnpm.overrides`.
4. Kryterium: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, `pnpm lint`,
   `pnpm build` dają wyniki stanu wyjściowego.

## Rozważane opcje

- Zostać przy bun: odrzucone (nie działa na serwerze, sprzeczne z kontraktem).
- npm: działa, ale sprzeczne z kontraktem.

## Konsekwencje

- Lovable po synchronizacji zobaczy `pnpm-lock.yaml` zamiast `bun.lock`; sposób budowania w Lovable
  może się zmienić. Dotyczy tylko publikacji w Lovable, którą wykonuje wyłącznie właściciel; ryzyko
  przyjęte do czasu przenosin na Vercel.
- Wersje paczek mogą się nieznacznie różnić od `bun.lock` (rozwiązanie z zakresów); wynik testów
  pozostaje kryterium.
