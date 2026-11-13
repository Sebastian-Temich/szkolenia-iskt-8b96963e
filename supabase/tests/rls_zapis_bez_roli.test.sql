-- W-05/K2 (T4, #9; ADR-001 pkt 3): zalogowany bez roli i gość (anon) nie zapiszą niczego w
-- szkolenia, trenerzy, szkolenie_trener ani user_roles. INSERT odrzuca RLS (bez roli) albo brak grantu
-- (anon, user_roles); UPDATE i DELETE bez roli nie trafiają w żaden wiersz (polityka USING is_staff()):
-- RETURNING jest pusty, a stan danych po próbach bez zmian. Dane tworzy test (prefiks t9-), niezależnie od seedu.
begin;
select plan(30);

-- Dane testowe (jako postgres). Wiersze opublikowane: konto bez roli je widzi, więc to najtrudniejszy
-- przypadek dla UPDATE i DELETE.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000901', 't9-bez-roli@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000902', 't9-redaktor@example.com', 'authenticated', 'authenticated');
-- Cudza rola: cel prób UPDATE i DELETE na user_roles.
insert into public.user_roles (user_id, role) values ('00000000-0000-4000-a000-000000000902', 'editor');

insert into public.szkolenia
  (id, sort_order, cat, icon, title, level, hours, format, price, opis, learn, program, for_whom, status)
values
  ('t9-szk-pub', 9101, 'AI', 'cpu', 'T9 opublikowane', 'Podstawowy', '1 dzień', 'Online', 100,
   'Opis', array['Efekt'], '[{"n":"01","t":"Moduł"}]', 'Dla wszystkich', 'published');

insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio, status) values
  ('t9-tr-pub', 9101, 'Trener Opublikowany', 'TO', 'Trener', array['AI'], 'Hasło', 'Bio', 'published'),
  ('t9-tr-pub-2', 9102, 'Trener Drugi', 'TD', 'Trener', array['AI'], 'Hasło', 'Bio', 'published');

insert into public.szkolenie_trener (szkolenie_id, trener_id) values ('t9-szk-pub', 't9-tr-pub');

create temp table t9_role_przed on commit drop as select user_id, role from public.user_roles;

-- Zalogowany bez roli.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-4000-a000-000000000901","role":"authenticated"}';

select is(
  (select count(*)::int from public.szkolenie_trener where szkolenie_id = 't9-szk-pub'),
  1,
  'bez roli: widzi opublikowane wiersze, na których próbuje zapisu'
);

select throws_ok(
  $$insert into public.szkolenia
      (id, sort_order, cat, icon, title, level, hours, format, price, opis, learn, program, for_whom)
    values ('t9-wlamanie', 9199, 'AI', 'cpu', 'X', 'X', 'X', 'X', 1, 'X', array['X'], '[{"n":"01"}]', 'X')$$,
  '42501', 'new row violates row-level security policy for table "szkolenia"',
  'bez roli: INSERT do szkolenia odrzucony przez RLS'
);
select is_empty(
  $$update public.szkolenia set title = 'Zmienione', status = 'draft' where id = 't9-szk-pub' returning id$$,
  'bez roli: UPDATE szkolenia nie zmienia żadnego wiersza'
);
select is_empty(
  $$delete from public.szkolenia where id = 't9-szk-pub' returning id$$,
  'bez roli: DELETE ze szkolenia nie usuwa żadnego wiersza'
);

select throws_ok(
  $$insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio)
    values ('t9-wlamanie', 9199, 'X', 'X', 'X', array['AI'], 'X', 'X')$$,
  '42501', 'new row violates row-level security policy for table "trenerzy"',
  'bez roli: INSERT do trenerzy odrzucony przez RLS'
);
select is_empty(
  $$update public.trenerzy set name = 'Zmienione', status = 'draft' where id = 't9-tr-pub' returning id$$,
  'bez roli: UPDATE trenerzy nie zmienia żadnego wiersza'
);
select is_empty(
  $$delete from public.trenerzy where id = 't9-tr-pub' returning id$$,
  'bez roli: DELETE z trenerzy nie usuwa żadnego wiersza'
);

select throws_ok(
  $$insert into public.szkolenie_trener (szkolenie_id, trener_id) values ('t9-szk-pub', 't9-tr-pub-2')$$,
  '42501', 'new row violates row-level security policy for table "szkolenie_trener"',
  'bez roli: INSERT do szkolenie_trener odrzucony przez RLS'
);
select is_empty(
  $$update public.szkolenie_trener set sort_order_trener = 7 where szkolenie_id = 't9-szk-pub' returning trener_id$$,
  'bez roli: UPDATE szkolenie_trener nie zmienia żadnego wiersza'
);
select is_empty(
  $$delete from public.szkolenie_trener where szkolenie_id = 't9-szk-pub' returning trener_id$$,
  'bez roli: DELETE z szkolenie_trener nie usuwa żadnego wiersza'
);

select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-4000-a000-000000000901', 'admin')$$,
  '42501', 'permission denied for table user_roles',
  'bez roli: INSERT do user_roles (samonadanie roli admin) odrzucony'
);
select throws_ok(
  $$update public.user_roles set role = 'admin'$$,
  '42501', 'permission denied for table user_roles',
  'bez roli: UPDATE user_roles odrzucony'
);
select throws_ok(
  $$delete from public.user_roles$$,
  '42501', 'permission denied for table user_roles',
  'bez roli: DELETE z user_roles odrzucony'
);
select throws_ok(
  $$select * from public.user_roles$$,
  '42501', 'permission denied for table user_roles',
  'bez roli: SELECT z user_roles odrzucony'
);

reset role;

-- Gość (anon): brak grantów zapisu na wszystkich tabelach.
set local role anon;
set local "request.jwt.claims" to '{"role":"anon"}';

select throws_ok(
  $$insert into public.szkolenia
      (id, sort_order, cat, icon, title, level, hours, format, price, opis, learn, program, for_whom)
    values ('t9-wlamanie', 9199, 'AI', 'cpu', 'X', 'X', 'X', 'X', 1, 'X', array['X'], '[{"n":"01"}]', 'X')$$,
  '42501', 'permission denied for table szkolenia',
  'anon: INSERT do szkolenia odrzucony'
);
select throws_ok(
  $$update public.szkolenia set title = 'Zmienione' where id = 't9-szk-pub'$$,
  '42501', 'permission denied for table szkolenia',
  'anon: UPDATE szkolenia odrzucony'
);
select throws_ok(
  $$delete from public.szkolenia where id = 't9-szk-pub'$$,
  '42501', 'permission denied for table szkolenia',
  'anon: DELETE ze szkolenia odrzucony'
);
select throws_ok(
  $$insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio)
    values ('t9-wlamanie', 9199, 'X', 'X', 'X', array['AI'], 'X', 'X')$$,
  '42501', 'permission denied for table trenerzy',
  'anon: INSERT do trenerzy odrzucony'
);
select throws_ok(
  $$update public.trenerzy set name = 'Zmienione' where id = 't9-tr-pub'$$,
  '42501', 'permission denied for table trenerzy',
  'anon: UPDATE trenerzy odrzucony'
);
select throws_ok(
  $$delete from public.trenerzy where id = 't9-tr-pub'$$,
  '42501', 'permission denied for table trenerzy',
  'anon: DELETE z trenerzy odrzucony'
);
select throws_ok(
  $$insert into public.szkolenie_trener (szkolenie_id, trener_id) values ('t9-szk-pub', 't9-tr-pub-2')$$,
  '42501', 'permission denied for table szkolenie_trener',
  'anon: INSERT do szkolenie_trener odrzucony'
);
select throws_ok(
  $$update public.szkolenie_trener set sort_order_trener = 7 where szkolenie_id = 't9-szk-pub'$$,
  '42501', 'permission denied for table szkolenie_trener',
  'anon: UPDATE szkolenie_trener odrzucony'
);
select throws_ok(
  $$delete from public.szkolenie_trener where szkolenie_id = 't9-szk-pub'$$,
  '42501', 'permission denied for table szkolenie_trener',
  'anon: DELETE z szkolenie_trener odrzucony'
);
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-4000-a000-000000000901', 'admin')$$,
  '42501', 'permission denied for table user_roles',
  'anon: INSERT do user_roles odrzucony'
);
select throws_ok(
  $$update public.user_roles set role = 'admin'$$,
  '42501', 'permission denied for table user_roles',
  'anon: UPDATE user_roles odrzucony'
);
select throws_ok(
  $$delete from public.user_roles$$,
  '42501', 'permission denied for table user_roles',
  'anon: DELETE z user_roles odrzucony'
);

reset role;

-- Stan po wszystkich próbach (jako postgres): nic się nie zmieniło.
select is(
  (select title || ' | ' || status || ' | ' || (published_at is not null)
   from public.szkolenia where id = 't9-szk-pub'),
  'T9 opublikowane | published | true',
  'po próbach: szkolenie istnieje, tytuł i status bez zmian'
);
select is(
  (select name || ' | ' || status || ' | ' || (published_at is not null)
   from public.trenerzy where id = 't9-tr-pub'),
  'Trener Opublikowany | published | true',
  'po próbach: trener istnieje, imię i status bez zmian'
);
select is(
  (select coalesce(string_agg(szkolenie_id || '>' || trener_id || ' ' || sort_order_trener, ','
      order by trener_id), '-')
   from public.szkolenie_trener where szkolenie_id like 't9-%'),
  't9-szk-pub>t9-tr-pub 0',
  'po próbach: jedno przypisanie, bez nowego i bez zmiany kolejności'
);
select set_eq(
  $$select user_id, role from public.user_roles$$,
  $$select user_id, role from pg_temp.t9_role_przed$$,
  'po próbach: user_roles bez zmian (konto bez roli nadal bez roli)'
);

select * from finish();
rollback;
