#!/usr/bin/env bash
# Test skryptów wdrożenia bazy produkcyjnej (supabase/produkcja/, ADR-005 pkt 7, W-15–W-17).
#
# Uruchamia go job CI `baza` na czystej bazie z migracji BEZ seeda (`supabase db reset --local
# --no-seed`): seed.sql ma trenerów, przypisania i konta testowe, które zafałszowałyby sprawdzenie
# „9 szkoleń, bez trenerów i przypisań”. Skrypty idą przez `psql -f` tak jak w SQL Editor (całe pliki,
# bez zmian poza PARAMETREM na górze, podmienianym w kopii w katalogu tymczasowym).
# Baza po teście jest zmieniona (M2 cofnięta i wgrana ponownie): job resetuje ją potem z seedem.
#
# Użycie: DB_URL=postgresql://postgres:postgres@127.0.0.1:PORT/postgres bash supabase/produkcja/ci/test-skryptow.sh
set -euo pipefail

: "${DB_URL:?Ustaw DB_URL (adres lokalnej bazy z supabase status)}"

KATALOG="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRACJA_M2="$KATALOG/../migrations/20261113204457_uprawnienia_funkcji_rol.sql"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/produkcja.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

PARAM_TRYB_PO="select set_config('produkcja.tryb', 'po-M2', false);"
PARAM_TRYB_PRZED="select set_config('produkcja.tryb', 'przed-M2', false);"
PARAM_REDAKCJA="select set_config('produkcja.redakcja', 'redaktor-1@example.com,redaktor-2@example.com', false);"

psql_bazy() {
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 "$@"
}

krok() {
  echo
  echo "=== $1"
}

# Uruchamia plik SQL; błąd psql kończy test.
uruchom() {
  echo "--- psql -f ${1#"$KATALOG"/}"
  psql_bazy -f "$1"
}

# Uruchamia plik SQL, który MA się nie udać, i sprawdza fragment komunikatu błędu.
uruchom_z_bledem() {
  local plik="$1" fragment="$2" log="$TMP/blad.log"
  echo "--- psql -f ${plik#"$KATALOG"/} (oczekiwany błąd: $fragment)"
  if psql_bazy -f "$plik" >"$log" 2>&1; then
    cat "$log"
    echo "::error::${plik##*/}: oczekiwano błędu „$fragment”, a skrypt przeszedł"
    exit 1
  fi
  if ! grep -qF -- "$fragment" "$log"; then
    cat "$log"
    echo "::error::${plik##*/}: błąd bez fragmentu „$fragment”"
    exit 1
  fi
  echo "ok: błąd zgodnie z oczekiwaniem"
}

# Kopia skryptu z podmienionym PARAMETREM (dokładny tekst linii, pierwsze wystąpienie).
wariant() {
  local zrodlo="$1" stary="$2" nowy="$3" cel="$4" tresc
  tresc="$(cat "$zrodlo")"
  if [[ "$tresc" != *"$stary"* ]]; then
    echo "::error::${zrodlo##*/}: brak linii PARAMETRU „$stary”"
    exit 1
  fi
  printf '%s\n' "${tresc/"$stary"/"$nowy"}" >"$cel"
}

# Asercja: zapytanie SQL ma zwrócić dokładnie oczekiwany tekst.
sprawdz() {
  local opis="$1" zapytanie="$2" oczekiwane="$3" wynik
  wynik="$(psql_bazy -t -A -c "$zapytanie")"
  if [[ "$wynik" != "$oczekiwane" ]]; then
    echo "::error::$opis"
    echo "  jest:       $wynik"
    echo "  oczekiwano: $oczekiwane"
    exit 1
  fi
  echo "ok: $opis"
}

ROLE_KONT="select coalesce(string_agg(u.email || ':' || coalesce((select string_agg(r.role::text, ',' order by r.role) from public.user_roles r where r.user_id = u.id), '-'), ' ' order by u.email collate \"C\"), '-') from auth.users u"
TRESC_SZKOLEN="select md5(string_agg(row(id, sort_order, cat, icon, title, level, hours, format, price, badge, fundable, opis, learn, program, for_whom, terms, status)::text, E'\n' order by id)) from public.szkolenia"
# md5 treści 9 szkoleń z supabase/seed.sql (to samo zapytanie na bazie po `shctl db reset`).
TRESC_SEED="adcf72a72a83af7d2570780bd940b9df"
SZKOLENIA="select coalesce(string_agg(id || ':' || status || ':' || (published_at is not null), ' ' order by sort_order), '-') from public.szkolenia"
HISTORIA="select coalesce(string_agg(version, ',' order by version), '-') from supabase_migrations.schema_migrations"

wariant "$KATALOG/01-sprawdz-baze.sql" "$PARAM_TRYB_PO" "$PARAM_TRYB_PRZED" "$TMP/01-przed-M2.sql"
wariant "$KATALOG/03-role.sql" "$PARAM_REDAKCJA" \
  "select set_config('produkcja.redakcja', ' Admin@Example.com , redaktor-1@example.com', false);" \
  "$TMP/03-z-adminem.sql"
wariant "$KATALOG/03-role.sql" "$PARAM_REDAKCJA" \
  "select set_config('produkcja.redakcja', 'redaktor-1@example.com,nie-ma-konta@example.com', false);" \
  "$TMP/03-brak-konta.sql"

krok "0. Baza z migracji bez seeda"
sprawdz "brak danych seeda (szkolenia, trenerzy, przypisania, konta)" \
  "select (select count(*) from public.szkolenia) || ',' || (select count(*) from public.trenerzy) || ',' || (select count(*) from public.szkolenie_trener) || ',' || (select count(*) from auth.users)" \
  "0,0,0,0"
sprawdz "historia migracji po reset: bazowa i M2" "$HISTORIA" "20261112232552,20261113204457"

krok "1. W-16: 02-dane-startowe.sql dwa razy"
uruchom "$KATALOG/02-dane-startowe.sql"
uruchom "$KATALOG/02-dane-startowe.sql"
sprawdz "W-16: 9 opublikowanych szkoleń startowych, bez duplikatów, w kolejności" "$SZKOLENIA" \
  "genai:published:true esg:published:true eng-b2:published:true fullstack:published:true ai-agents:published:true co2:published:true python:published:true grants:published:true eng-it:published:true"
sprawdz "W-16: treść 9 szkoleń 1:1 z supabase/seed.sql" "$TRESC_SZKOLEN" "$TRESC_SEED"
sprawdz "W-16: bez trenerów, przypisań i kont" \
  "select (select count(*) from public.trenerzy) || ',' || (select count(*) from public.szkolenie_trener) || ',' || (select count(*) from auth.users) || ',' || (select count(*) from public.user_roles)" \
  "0,0,0,0"

krok "2. W-17: 03-role.sql z kontami testowymi @example.com"
psql_bazy -c "insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-0000000c1001', 'admin@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-0000000c1002', 'redaktor-1@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-0000000c1003', 'Redaktor-2@Example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-0000000c1004', 'bez-roli@example.com', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values ('00000000-0000-4000-a000-0000000c1001', 'admin');"
uruchom "$KATALOG/03-role.sql"
ROLE_PO_03="Redaktor-2@Example.com:editor admin@example.com:admin bez-roli@example.com:- redaktor-1@example.com:editor"
sprawdz "W-17: rola editor nadana obu kontom (wielkość liter adresu bez znaczenia), admin bez zmian" \
  "$ROLE_KONT" "$ROLE_PO_03"
psql_bazy -c "create schema ci_produkcja; create table ci_produkcja.role as select * from public.user_roles;"
ZMIANY_ROL="select (select count(*) from (select * from public.user_roles except select * from ci_produkcja.role) a) || ',' || (select count(*) from (select * from ci_produkcja.role except select * from public.user_roles) b)"
uruchom "$KATALOG/03-role.sql"
sprawdz "W-17: ponowne uruchomienie 03-role.sql bez zmian (te same wiersze i created_at)" "$ZMIANY_ROL" "0,0"
uruchom "$TMP/03-z-adminem.sql"
sprawdz "W-17: konto admin w parametrze pominięte, rola admin nietknięta" "$ROLE_KONT" "$ROLE_PO_03"
sprawdz "W-17: wariant z adminem bez zmian w user_roles" "$ZMIANY_ROL" "0,0"
uruchom_z_bledem "$TMP/03-brak-konta.sql" "Brak kont dla adresów: nie-ma-konta@example.com"
sprawdz "W-17: brak konta przerywa skrypt bez zmian" "$ZMIANY_ROL" "0,0"

krok "3. W-15, W-17: 01-sprawdz-baze.sql w trybie po-M2"
uruchom "$KATALOG/01-sprawdz-baze.sql"
uruchom_z_bledem "$TMP/01-przed-M2.sql" "NIEZGODNOŚĆ (tryb przed-M2)"
sprawdz "01-sprawdz-baze.sql niczego nie zmienia" "$ZMIANY_ROL" "0,0"

krok "4. W-15: 09-cofnij.sql (szkolenie z przypisanym trenerem zostaje)"
psql_bazy -c "insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio, status)
  values ('trener-ci', 1, 'Trener CI', 'TC', 'Rola testowa', array['AI'], 'Opis testowy', 'Bio testowe', 'published');
  insert into public.szkolenie_trener (szkolenie_id, trener_id) values ('genai', 'trener-ci');"
uruchom "$KATALOG/09-cofnij.sql"
sprawdz "W-15: usunięte szkolenia startowe bez przypisań, genai z przypisaniem zostaje" "$SZKOLENIA" \
  "genai:published:true"
sprawdz "W-15: historia migracji pusta" "$HISTORIA" "-"
sprawdz "W-15: konta i role (admin, redakcja) zostają" "$ROLE_KONT" "$ROLE_PO_03"
sprawdz "W-15: anon znowu ma EXECUTE na is_staff, is_admin, moje_role (stan sprzed M2)" \
  "select has_function_privilege('anon', 'public.is_staff()', 'execute') and has_function_privilege('anon', 'public.is_admin()', 'execute') and has_function_privilege('anon', 'public.moje_role()', 'execute')" \
  "t"

krok "5. W-15: 01-sprawdz-baze.sql w trybie przed-M2 (pusta historia)"
uruchom "$TMP/01-przed-M2.sql"
uruchom_z_bledem "$KATALOG/01-sprawdz-baze.sql" "NIEZGODNOŚĆ (tryb po-M2)"

krok "6. 09-cofnij.sql drugi raz (idempotentny)"
uruchom "$KATALOG/09-cofnij.sql"
uruchom "$TMP/01-przed-M2.sql"

krok "7. W-15: ponowne wykonanie migracji M2 przez psql -f"
uruchom "$MIGRACJA_M2"

krok "8. Ścieżka wdrożenia od nowa: historia jak po repair i db push, 01 po-M2"
psql_bazy -c "insert into supabase_migrations.schema_migrations (version, name) values
  ('20261112232552', 'baza'), ('20261113204457', 'uprawnienia_funkcji_rol');"
uruchom "$KATALOG/01-sprawdz-baze.sql"
uruchom "$KATALOG/02-dane-startowe.sql"
sprawdz "02 po cofnięciu przywraca 9 szkoleń startowych" "$TRESC_SZKOLEN" "$TRESC_SEED"

psql_bazy -c "drop schema ci_produkcja cascade;"
echo
echo "Skrypty supabase/produkcja: wszystkie sprawdzenia zielone."
