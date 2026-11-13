-- W-05/K4 (T4, #9; ADR-001 pkt 3): moje_role() i is_staff() zwracają tylko role wywołującego; gość
-- (anon) dostaje pusty wynik i false; has_role() jest niedostępne dla anon i authenticated (EXECUTE
-- tylko postgres i service_role). Dane tworzy test, niezależnie od seedu.
begin;
select plan(13);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000901', 't9-bez-roli@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000902', 't9-redaktor@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000903', 't9-admin@example.com', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-a000-000000000902', 'editor'),
  ('00000000-0000-4000-a000-000000000903', 'admin');

-- Redaktor (editor).
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-4000-a000-000000000902","role":"authenticated"}';
select is(
  (select coalesce(string_agg(r::text, ',' order by r), '-') from public.moje_role() r),
  'editor',
  'editor: moje_role() zwraca tylko editor (bez roli admin innego konta)'
);
select is(public.is_staff(), true, 'editor: is_staff() = true');
select throws_ok(
  $$select public.has_role('00000000-0000-4000-a000-000000000903', 'admin')$$,
  '42501', 'permission denied for function has_role',
  'editor: has_role() niedostępne'
);
reset role;

-- Administrator (admin).
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-4000-a000-000000000903","role":"authenticated"}';
select is(
  (select coalesce(string_agg(r::text, ',' order by r), '-') from public.moje_role() r),
  'admin',
  'admin: moje_role() zwraca tylko admin (bez roli editor innego konta)'
);
select is(public.is_staff(), true, 'admin: is_staff() = true');
select throws_ok(
  $$select public.has_role('00000000-0000-4000-a000-000000000902', 'editor')$$,
  '42501', 'permission denied for function has_role',
  'admin: has_role() niedostępne'
);
reset role;

-- Zalogowany bez roli.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-4000-a000-000000000901","role":"authenticated"}';
select is(
  (select coalesce(string_agg(r::text, ',' order by r), '-') from public.moje_role() r),
  '-',
  'bez roli: moje_role() pusty wynik (nie widzi ról innych kont)'
);
select is(public.is_staff(), false, 'bez roli: is_staff() = false');
select throws_ok(
  $$select public.has_role('00000000-0000-4000-a000-000000000902', 'editor')$$,
  '42501', 'permission denied for function has_role',
  'bez roli: has_role() niedostępne'
);
reset role;

-- Gość (anon).
set local role anon;
set local "request.jwt.claims" to '{"role":"anon"}';
select is(
  (select count(*)::int from public.moje_role()),
  0,
  'anon: moje_role() pusty wynik'
);
select is(public.is_staff(), false, 'anon: is_staff() = false');
select throws_ok(
  $$select public.has_role('00000000-0000-4000-a000-000000000902', 'editor')$$,
  '42501', 'permission denied for function has_role',
  'anon: has_role() niedostępne'
);
reset role;

-- Kontrola danych: has_role działa dla właściciela, więc odmowa wyżej to brak uprawnienia, nie błąd funkcji.
select is(
  public.has_role('00000000-0000-4000-a000-000000000902', 'editor'),
  true,
  'postgres: has_role() działa (kontrola, że odmowa wyżej wynika z braku EXECUTE)'
);

select * from finish();
rollback;
