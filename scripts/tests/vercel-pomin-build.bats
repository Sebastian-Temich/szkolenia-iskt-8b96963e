#!/usr/bin/env bats
# scripts/vercel-pomin-build.sh: Ignored Build Step Vercel (ADR-006 pkt 2, W-18, issue #71).
# Kod 0 = Vercel pomija build, 1 = buduje. Zakres zmian: od VERCEL_GIT_PREVIOUS_SHA (ostatnie udane
# wdrożenie gałęzi) do HEAD, więc liczą się wszystkie commity pushu, nie tylko ostatni.

setup() {
  SKRYPT="$BATS_TEST_DIRNAME/../vercel-pomin-build.sh"
  R="$(mktemp -d "${TMPDIR:-/tmp}/vercel-pomin.XXXXXX")"
  export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com
  export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com
  export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
  cd "$R"
  git init -q
  mkdir -p src docs supabase/migrations
  echo a > src/app.tsx
  echo a > docs/x.md
  echo '{}' > package.json
  echo a > vite.config.ts
  echo a > CHANGELOG.md
  git add .
  git commit -q -m start
  POCZATEK="$(git rev-parse HEAD)"
  unset VERCEL_GIT_PREVIOUS_SHA
}

teardown() {
  rm -rf "$R"
}

zmien() {
  local plik
  for plik in "$@"; do
    mkdir -p "$(dirname "$plik")"
    echo "$RANDOM" >> "$plik"
    git add "$plik"
  done
  git commit -q -m "zmiana $*"
}

@test "tylko docs/: pomija build (0)" {
  zmien docs/x.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 0 ]
}

@test "tylko CHANGELOG.md: pomija build (0)" {
  zmien CHANGELOG.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 0 ]
}

@test "commity orkiestratora: docs/, CHANGELOG.md, .github/ i scripts/ w kilku commitach pomijaja build (0)" {
  zmien docs/Projekt.md CHANGELOG.md
  zmien docs/historia.md
  zmien .github/workflows/ci.yml scripts/sync-status.sh README.md AGENTS.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 0 ]
}

@test "zmiana w src/: buduje (1)" {
  zmien src/app.tsx
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "zmiana package.json: buduje (1)" {
  zmien package.json
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "zmiana vite.config.ts: buduje (1)" {
  zmien vite.config.ts
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "zmiana w supabase/: buduje (1)" {
  zmien supabase/migrations/20261117000000_x.sql
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "docs/ razem z src/ w jednym commicie: buduje (1)" {
  zmien docs/x.md src/app.tsx
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "kilka commitow w pushu: src/ we wczesniejszym, ostatni tylko docs/ - buduje (1)" {
  zmien src/app.tsx
  zmien docs/x.md
  zmien CHANGELOG.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "kilka commitow: liczy sie zakres od VERCEL_GIT_PREVIOUS_SHA, nie cala historia" {
  zmien src/app.tsx
  WDROZONY="$(git rev-parse HEAD)"
  zmien docs/x.md
  zmien CHANGELOG.md
  VERCEL_GIT_PREVIOUS_SHA="$WDROZONY" run bash "$SKRYPT"
  [ "$status" -eq 0 ]
}

@test "katalogi podobne do docs/ nie sa pomijane: docs-stare/ i src/docs/ buduja (1)" {
  zmien docs-stare/a.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
  POCZ2="$(git rev-parse HEAD)"
  zmien src/docs/b.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZ2" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "polskie znaki w nazwie pliku w docs/: pomija build (0)" {
  zmien "docs/00-intake/źródła ł.md"
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 0 ]
}

@test "przeniesienie pliku z src/ do docs/: buduje (1)" {
  git mv src/app.tsx docs/app.tsx
  git commit -q -m przeniesienie
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "nowy plik .md w katalogu glownym spoza listy buduje (1)" {
  zmien NOWY.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "brak VERCEL_GIT_PREVIOUS_SHA (pierwsze wdrozenie): buduje (1)" {
  zmien docs/x.md
  run bash "$SKRYPT"
  [ "$status" -eq 1 ]
  VERCEL_GIT_PREVIOUS_SHA="" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "VERCEL_GIT_PREVIOUS_SHA spoza klonu (plytki klon, przepisana historia): buduje (1)" {
  zmien docs/x.md
  VERCEL_GIT_PREVIOUS_SHA=0123456789abcdef0123456789abcdef01234567 run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "ten sam commit co ostatnie wdrozenie (pusty zakres, ponowne wdrozenie): buduje (1)" {
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [ "$status" -eq 1 ]
}

@test "wyjscie mowi, co zdecydowano" {
  zmien docs/x.md
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [[ "$output" == *"pomijam build"* ]]
  zmien src/app.tsx
  VERCEL_GIT_PREVIOUS_SHA="$POCZATEK" run bash "$SKRYPT"
  [[ "$output" == *"src/app.tsx"* ]]
}
