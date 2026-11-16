#!/usr/bin/env bash
# Ignored Build Step Vercel (ADR-006 pkt 2, W-18, issue #71).
# Ustawienie w Vercel: Settings → Build and Deployment → Ignored Build Step → Custom:
#   bash scripts/vercel-pomin-build.sh
# Kod wyjścia według Vercel: 0 = pomiń build (bez wdrożenia), 1 = buduj.
#
# Zakres zmian: od VERCEL_GIT_PREVIOUS_SHA (commit ostatniego udanego wdrożenia tej gałęzi) do HEAD,
# więc liczą się wszystkie commity pushu, a nie tylko ostatni. Build jest pomijany tylko wtedy, gdy
# KAŻDY zmieniony plik pasuje do listy POZA_APLIKACJA. W razie wątpliwości skrypt buduje: brak
# VERCEL_GIT_PREVIOUS_SHA (pierwsze wdrożenie), commit spoza płytkiego klonu Vercel, pusty zakres
# (ponowne wdrożenie tego samego commita) albo błąd git.

set -u

# Ścieżki, których zmiana nie wpływa na zbudowaną aplikację (wzorce bash `case`; katalog z „/*”).
# supabase/ celowo nie ma na liście (kryterium W-18 w #71): zmiana bazy buduje aplikację.
POZA_APLIKACJA=(
  "docs/*"
  "CHANGELOG.md"
  "README.md"
  "AGENTS.md"
  "CLAUDE.md"
  "roadmap.md"
  ".github/*"
  ".claude/*"
  ".lovable/*"
  "scripts/*"
)

buduj() {
  echo "vercel-pomin-build: buduję ($1)"
  exit 1
}

poza_aplikacja() {
  local plik="$1" wzorzec
  for wzorzec in "${POZA_APLIKACJA[@]}"; do
    # shellcheck disable=SC2254 # wzorzec ma działać jak glob
    case "$plik" in $wzorzec) return 0 ;; esac
  done
  return 1
}

poprzedni="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -n "$poprzedni" ] || buduj "brak VERCEL_GIT_PREVIOUS_SHA, pierwsze wdrożenie gałęzi"
git cat-file -e "${poprzedni}^{commit}" 2>/dev/null \
  || buduj "commit $poprzedni nie istnieje w klonie"

# -z: nazwy bez cytowania (polskie znaki w docs/), --no-renames: przeniesienie z src/ do docs/ to
# usunięcie w src/, więc buduje.
lista="$(mktemp "${TMPDIR:-/tmp}/vercel-pomin.XXXXXX")" || buduj "mktemp nie powiódł się"
trap 'rm -f "$lista"' EXIT
git diff --name-only --no-renames -z "$poprzedni" HEAD -- >"$lista" \
  || buduj "git diff $poprzedni..HEAD nie powiódł się"
[ -s "$lista" ] || buduj "brak zmian od $poprzedni (ponowne wdrożenie)"

while IFS= read -r -d '' plik; do
  poza_aplikacja "$plik" || buduj "zmiana w aplikacji: $plik"
done <"$lista"

echo "vercel-pomin-build: pomijam build, od $poprzedni zmieniły się tylko pliki spoza aplikacji"
exit 0
