---
wersja_procesu: 2
etap_wdrozenia: A
tryb_procesu: M
odbior_S: reczny
pochodzenie: adopt
blok_portow: "55421-55429"
adopt:
  repo: Sebastian-Temich/szkolenia-iskt-8b96963e
  widocznosc: public
  data: 2026-11-12
  analiza_od: "2026-11-12T13:30Z"
  analiza_do: "2026-11-12T15:30Z"
  limit_analizy_min: 120
  lovable: true
  supabase: true
  produkcja: brak dostępu agentów
---

# Konfiguracja projektu

Projekt przejęty przez `shctl adopt` (`sh-system/docs/proces.md`, „Projekty przejęte”). Pełną
konfigurację z szablonu dostaje adaptacja po akceptacji analizy (`shctl adopt adaptacja`).

| Pole | Znaczenie |
|---|---|
| `pochodzenie` | `adopt`: projekt przejęty, etapy zaczynają się od `00-analiza` |
| `adopt.repo` | Repo przejęte; widoczność zmienia tylko `shctl adopt upublicznij` po decyzji właściciela |
| `adopt.analiza_od`, `adopt.analiza_do` | Okno analizy (UTC); `limit_analizy_min` z `/Users/Shared/sh/konfiguracja.md` albo `--limit-analizy` |
| `adopt.lovable`, `adopt.supabase` | Wynik `scripts/adopt/wykryj.sh` przy przejęciu |
| `adopt.produkcja` | Agenci nie mają dostępu do produkcji ani chmury Supabase |
