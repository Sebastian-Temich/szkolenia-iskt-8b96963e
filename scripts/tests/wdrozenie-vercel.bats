#!/usr/bin/env bats
# Workflow wdrożenia produkcji (ADR-006 pkt 2 i 6, W-21, issue #71): migracje produkcji po
# zatwierdzeniu w środowisku production i e2e na pushu do main (Deployment Checks: jakosc i e2e).
# Wymaga yq (mikefarah); w CI job skrypty sprawdza go przed testami, więc brak yq to błąd, nie skip.

setup() {
  command -v yq >/dev/null || { echo "brak yq" >&2; return 1; }
  W="$BATS_TEST_DIRNAME/../../.github/workflows"
  M="$W/migracje-produkcja.yml"
}

@test "migracje-produkcja: push na main tylko ze zmiana supabase/migrations/** i workflow_dispatch" {
  [ "$(yq -r '.on.push.branches | join(",")' "$M")" = main ]
  [ "$(yq -r '.on.push.paths | join(",")' "$M")" = 'supabase/migrations/**' ]
  [ "$(yq -r '.on | has("workflow_dispatch")' "$M")" = true ]
  [ "$(yq -r '.on | keys | join(",")' "$M")" = push,workflow_dispatch ]
}

@test "migracje-produkcja: bez pull_request i pull_request_target" {
  ! grep -q 'pull_request' "$M"
}

@test "migracje-produkcja: permissions tylko contents: read" {
  [ "$(yq -r '.permissions | to_entries | map(.key + "=" + .value) | join(",")' "$M")" = contents=read ]
  [ "$(yq -r '[.jobs[] | select(has("permissions"))] | length' "$M")" = 0 ]
}

@test "migracje-produkcja: concurrency z jedna stala grupa, bez anulowania" {
  [ "$(yq -r '.concurrency.group' "$M")" = migracje-produkcja ]
  [ "$(yq -r '.concurrency["cancel-in-progress"]' "$M")" = false ]
}

@test "migracje-produkcja: jeden job w srodowisku production, tylko z main, na runnerze GitHuba" {
  [ "$(yq -r '.jobs | length' "$M")" = 1 ]
  [ "$(yq -r '.jobs[].environment' "$M")" = production ]
  [ "$(yq -r '.jobs[].if' "$M")" = "github.ref == 'refs/heads/main'" ]
  [ "$(yq -r '.jobs[]["runs-on"]' "$M")" = ubuntu-24.04 ]
}

@test "migracje-produkcja: sekrety tylko przez secrets.* w jobie srodowiska production" {
  # Poza jobem (on, env workflow) brak odwołań do sekretów.
  [ "$(yq -r 'del(.jobs) | .. | select(tag == "!!str") | select(test("secrets\."))' "$M")" = "" ]
  # W jobie dokładnie trzy sekrety z ADR-006 pkt 6, każdy jako secrets.NAZWA w env joba.
  [ "$(yq -r '.jobs[].env | to_entries | map(select(.value | test("secrets\."))) | map(.key + "=" + .value) | sort | join(",")' "$M")" = \
    'SUPABASE_ACCESS_TOKEN=${{ secrets.SUPABASE_ACCESS_TOKEN }},SUPABASE_DB_PASSWORD=${{ secrets.SUPABASE_DB_PASSWORD }},SUPABASE_PROJECT_ID=${{ secrets.SUPABASE_PROJECT_ID }}' ]
  # Kroki nie wstawiają sekretów do komend (tylko przez zmienne środowiska joba).
  [ "$(yq -r '.jobs[].steps[] | (.run // "") + (.with // {} | tostring)' "$M" | grep -c 'secrets\.')" -eq 0 ]
}

@test "migracje-produkcja: link, db push --dry-run, potem db push, w tej kolejnosci" {
  kroki="$(yq -r '.jobs[].steps[].run // ""' "$M")"
  n_link="$(grep -n 'supabase link --project-ref "\$SUPABASE_PROJECT_ID"' <<<"$kroki" | cut -d: -f1)"
  n_dry="$(grep -n 'supabase db push --dry-run' <<<"$kroki" | cut -d: -f1)"
  n_push="$(grep -n 'supabase db push --yes' <<<"$kroki" | cut -d: -f1)"
  [ -n "$n_link" ] && [ -n "$n_dry" ] && [ -n "$n_push" ]
  [ "$n_link" -lt "$n_dry" ] && [ "$n_dry" -lt "$n_push" ]
  # Bez --db-url i bez --include-all/--include-seed (tylko migracje z repo, bez seeda).
  ! grep -qE -- '--db-url|--include-seed|--include-all' <<<"$kroki"
}

@test "migracje-produkcja: reczne uruchomienie domyslnie tylko podglad, push zawsze wykonuje" {
  [ "$(yq -r '.on.workflow_dispatch.inputs.tylko_podglad.type' "$M")" = boolean ]
  [ "$(yq -r '.on.workflow_dispatch.inputs.tylko_podglad.default' "$M")" = true ]
  [ "$(yq -r '.jobs[].steps[] | select((.run // "") | test("db push --yes")) | .if' "$M")" = \
    "github.event_name == 'push' || inputs.tylko_podglad == false" ]
  [ "$(yq -r '.jobs[].steps[] | select((.run // "") | test("--dry-run")) | .if // "brak"' "$M")" = brak ]
}

@test "migracje-produkcja: ta sama wersja Supabase CLI co job baza w ci.yml" {
  [ "$(yq -r '.jobs[].steps[] | select(.uses // "" | test("^supabase/setup-cli@")) | .with.version' "$M")" = \
    "$(yq -r '.jobs.baza.steps[] | select(.uses // "" | test("^supabase/setup-cli@")) | .with.version' "$W/ci.yml")" ]
}

@test "migracje-produkcja: akcje przypiete do SHA" {
  [ "$(yq -r '.jobs[].steps[].uses // ""' "$M" | grep -v '^$' | grep -cvE '@[0-9a-f]{40}$')" -eq 0 ]
}

@test "ci.yml: e2e na kazdym PR, pushu do main i recznie (Deployment Checks: jakosc i e2e)" {
  [ "$(yq -r '.jobs.e2e.if // "brak"' "$W/ci.yml")" = brak ]
  [ "$(yq -r '.on.push.branches | join(",")' "$W/ci.yml")" = main ]
  [ "$(yq -r '.on | has("pull_request")' "$W/ci.yml")" = true ]
  [ "$(yq -r '.jobs | has("jakosc")' "$W/ci.yml")" = true ]
}

@test "ci.yml: concurrency nie anuluje biegow na main (Deployment Checks czekaja na wynik)" {
  [ "$(yq -r '.concurrency["cancel-in-progress"]' "$W/ci.yml")" = "\${{ github.event_name == 'pull_request' }}" ]
}

@test "ci.yml: job skrypty uruchamia testy bats wdrozenia" {
  kroki="$(yq -r '.jobs.skrypty.steps[].run // ""' "$W/ci.yml")"
  grep -q 'scripts/tests/vercel-pomin-build.bats' <<<"$kroki"
  grep -q 'scripts/tests/wdrozenie-vercel.bats' <<<"$kroki"
}
