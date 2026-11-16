-- 03-role.sql: rola editor dla kont redakcji na produkcji (ADR-005 pkt 4, W-17).
--
-- Uruchamia właściciel w SQL Editor dashboardu Supabase PO utworzeniu kont redakcji w dashboardzie
-- (Authentication → Users → Add user → Create new user, z hasłem i Auto Confirm). Instrukcja:
-- docs/wydanie/techniczna/produkcja-baza.md.
--
-- Zasady:
--   - konto musi już istnieć w auth.users; brak któregokolwiek adresu przerywa skrypt bez zmian;
--   - konto z rolą admin jest pomijane (rola admin bez zmian, admin ma już wszystkie uprawnienia);
--   - idempotentny: istniejąca rola editor zostaje (`on conflict do nothing`), skrypt niczego nie usuwa.
-- Wynik: lista podanych kont z ich rolami po zmianie.
--
-- =================================== PARAMETR (jedyne miejsce do zmiany) ============================
-- Adresy e-mail kont redakcji, rozdzielone przecinkami. Prawdziwe adresy wpisujesz TYLKO w SQL Editor,
-- nigdy w repo. W repo stoją adresy przykładowe z domeny example.com (testy CI).
select set_config('produkcja.redakcja', 'redaktor-1@example.com,redaktor-2@example.com', false);
-- =====================================================================================================

do $role$
declare
  v_adresy text[] := array(
    select distinct lower(btrim(a))
    from unnest(string_to_array(current_setting('produkcja.redakcja'), ',')) a
    where btrim(a) <> ''
  );
  v_brak text[];
  v_admini text[];
  v_nadane int;
begin
  if cardinality(v_adresy) = 0 then
    raise exception 'Brak adresów w PARAMETRZE na górze skryptu';
  end if;

  v_brak := array(
    select a from unnest(v_adresy) a
    where not exists (select 1 from auth.users u where lower(u.email) = a)
    order by a
  );
  if cardinality(v_brak) > 0 then
    raise exception 'Brak kont dla adresów: %. Utwórz je w dashboardzie (Add user) i uruchom skrypt ponownie; nic nie zmieniono.',
      array_to_string(v_brak, ', ');
  end if;

  v_admini := array(
    select a from unnest(v_adresy) a
    join auth.users u on lower(u.email) = a
    where exists (select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin')
    order by a
  );
  if cardinality(v_admini) > 0 then
    raise notice 'Pominięte konta z rolą admin (bez zmian): %', array_to_string(v_admini, ', ');
  end if;

  insert into public.user_roles (user_id, role)
  select u.id, 'editor'::public.app_role
  from auth.users u
  where lower(u.email) = any (v_adresy)
    and not exists (select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin')
  on conflict (user_id, role) do nothing;
  get diagnostics v_nadane = row_count;
  raise notice 'Nadano rolę editor: % kont (pozostałe już ją miały albo są adminami)', v_nadane;
end
$role$;

select u.email,
       coalesce((select string_agg(r.role::text, ',' order by r.role) from public.user_roles r
                 where r.user_id = u.id), '-') as role
from auth.users u
where lower(u.email) = any (
  select lower(btrim(a)) from unnest(string_to_array(current_setting('produkcja.redakcja'), ',')) a
)
order by u.email;
