-- W-05/K3 (T4, #9; ADR-001 pkt 3): redaktor z rolą editor i konto z rolą admin tworzą, publikują,
-- wycofują i usuwają szkolenie i trenera oraz zmieniają przypisania. published_at ustawia wyzwalacz
-- dotknij_updated_at przy publikacji i czyści przy wycofaniu. user_roles pozostaje dla nich
-- nieczytelne i niezapisywalne. Każdy krok zapisu sprawdza stan odczytem, bo UPDATE i DELETE
-- odrzucone przez RLS nie zgłaszają błędu. Dane tworzy test (prefiks t9-), niezależnie od seedu.
begin;
select plan(46);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000902', 't9-redaktor@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000903', 't9-admin@example.com', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-a000-000000000902', 'editor'),
  ('00000000-0000-4000-a000-000000000903', 'admin');

create temp table t9_role_przed on commit drop as select user_id, role from public.user_roles;

-- ---------------------------------------------------------------------------------------------
-- Redaktor (editor)
-- ---------------------------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-4000-a000-000000000902","role":"authenticated"}';

select lives_ok(
  $$insert into public.szkolenia
      (id, sort_order, cat, icon, title, level, hours, format, price, opis, learn, program, for_whom)
    values ('t9-e-szk', 9201, 'AI', 'cpu', 'T9 redaktor', 'Podstawowy', '1 dzień', 'Online', 100,
            'Opis', array['Efekt'], '[{"n":"01","t":"Moduł"}]', 'Dla wszystkich')$$,
  'editor: tworzy szkolenie (szkic)'
);
select lives_ok(
  $$insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio)
    values ('t9-e-tr', 9201, 'Trener Redaktora', 'TR', 'Trener', array['AI'], 'Hasło', 'Bio')$$,
  'editor: tworzy trenera (szkic)'
);
select is(
  (select (select status || ' ' || (published_at is null) from public.szkolenia where id = 't9-e-szk')
       || ' / ' || (select status || ' ' || (published_at is null) from public.trenerzy where id = 't9-e-tr')),
  'draft true / draft true',
  'editor: widzi swoje szkice, published_at puste'
);
select lives_ok(
  $$insert into public.szkolenie_trener (szkolenie_id, trener_id) values ('t9-e-szk', 't9-e-tr')$$,
  'editor: przypisuje trenera do szkolenia'
);
select lives_ok(
  $$update public.szkolenia set status = 'published' where id = 't9-e-szk'$$,
  'editor: publikuje szkolenie'
);
select lives_ok(
  $$update public.trenerzy set status = 'published' where id = 't9-e-tr'$$,
  'editor: publikuje trenera'
);
select is(
  (select (select status || ' ' || (published_at = now()) from public.szkolenia where id = 't9-e-szk')
       || ' / ' || (select status || ' ' || (published_at = now()) from public.trenerzy where id = 't9-e-tr')),
  'published true / published true',
  'editor: po publikacji status published i published_at ustawione na czas publikacji'
);
select lives_ok(
  $$update public.szkolenie_trener set sort_order_trener = 3, sort_order_szkolenie = 2
    where szkolenie_id = 't9-e-szk' and trener_id = 't9-e-tr'$$,
  'editor: zmienia kolejność w przypisaniu'
);
select is(
  (select sort_order_trener || ' ' || sort_order_szkolenie from public.szkolenie_trener
   where szkolenie_id = 't9-e-szk' and trener_id = 't9-e-tr'),
  '3 2',
  'editor: zmiana przypisania zapisana'
);
select lives_ok(
  $$update public.szkolenia set status = 'draft' where id = 't9-e-szk'$$,
  'editor: wycofuje szkolenie do szkicu'
);
select lives_ok(
  $$update public.trenerzy set status = 'draft' where id = 't9-e-tr'$$,
  'editor: wycofuje trenera do szkicu'
);
select is(
  (select (select status || ' ' || (published_at is null) from public.szkolenia where id = 't9-e-szk')
       || ' / ' || (select status || ' ' || (published_at is null) from public.trenerzy where id = 't9-e-tr')),
  'draft true / draft true',
  'editor: po wycofaniu status draft i published_at wyczyszczone'
);
select is(
  (select coalesce(string_agg(szkolenie_id || '>' || trener_id || ' ' || sort_order_trener || ' '
      || sort_order_szkolenie, ','), '-')
   from public.szkolenie_trener where szkolenie_id = 't9-e-szk'),
  't9-e-szk>t9-e-tr 3 2',
  'editor: widzi przypisanie między szkicem szkolenia i szkicem trenera'
);
select results_eq(
  $$delete from public.szkolenie_trener where szkolenie_id = 't9-e-szk' and trener_id = 't9-e-tr'
    returning szkolenie_id, trener_id$$,
  $$values ('t9-e-szk'::text, 't9-e-tr'::text)$$,
  'editor: usuwa przypisanie (DELETE zwraca dokładnie ten wiersz)'
);
select is(
  (select count(*)::int from public.szkolenie_trener where szkolenie_id = 't9-e-szk'),
  0,
  'editor: przypisanie usunięte'
);
select lives_ok($$delete from public.szkolenia where id = 't9-e-szk'$$, 'editor: usuwa szkolenie');
select lives_ok($$delete from public.trenerzy where id = 't9-e-tr'$$, 'editor: usuwa trenera');
select is(
  (select (select count(*) from public.szkolenia where id = 't9-e-szk')
       + (select count(*) from public.trenerzy where id = 't9-e-tr'))::int,
  0,
  'editor: szkolenie i trener usunięte'
);
select throws_ok(
  $$select * from public.user_roles$$,
  '42501', 'permission denied for table user_roles',
  'editor: SELECT z user_roles odrzucony'
);
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-4000-a000-000000000902', 'admin')$$,
  '42501', 'permission denied for table user_roles',
  'editor: INSERT do user_roles (nadanie sobie admin) odrzucony'
);
select throws_ok(
  $$update public.user_roles set role = 'admin'$$,
  '42501', 'permission denied for table user_roles',
  'editor: UPDATE user_roles odrzucony'
);
select throws_ok(
  $$delete from public.user_roles$$,
  '42501', 'permission denied for table user_roles',
  'editor: DELETE z user_roles odrzucony'
);

reset role;

-- ---------------------------------------------------------------------------------------------
-- Administrator (admin)
-- ---------------------------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-4000-a000-000000000903","role":"authenticated"}';

select lives_ok(
  $$insert into public.szkolenia
      (id, sort_order, cat, icon, title, level, hours, format, price, opis, learn, program, for_whom)
    values ('t9-a-szk', 9301, 'ESG', 'leaf', 'T9 admin', 'Podstawowy', '1 dzień', 'Online', 100,
            'Opis', array['Efekt'], '[{"n":"01","t":"Moduł"}]', 'Dla wszystkich')$$,
  'admin: tworzy szkolenie (szkic)'
);
select lives_ok(
  $$insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio)
    values ('t9-a-tr', 9301, 'Trener Admina', 'TA', 'Trener', array['ESG'], 'Hasło', 'Bio')$$,
  'admin: tworzy trenera (szkic)'
);
select is(
  (select (select status || ' ' || (published_at is null) from public.szkolenia where id = 't9-a-szk')
       || ' / ' || (select status || ' ' || (published_at is null) from public.trenerzy where id = 't9-a-tr')),
  'draft true / draft true',
  'admin: widzi swoje szkice, published_at puste'
);
select lives_ok(
  $$insert into public.szkolenie_trener (szkolenie_id, trener_id) values ('t9-a-szk', 't9-a-tr')$$,
  'admin: przypisuje trenera do szkolenia'
);
select lives_ok(
  $$update public.szkolenia set status = 'published' where id = 't9-a-szk'$$,
  'admin: publikuje szkolenie'
);
select lives_ok(
  $$update public.trenerzy set status = 'published' where id = 't9-a-tr'$$,
  'admin: publikuje trenera'
);
select is(
  (select (select status || ' ' || (published_at = now()) from public.szkolenia where id = 't9-a-szk')
       || ' / ' || (select status || ' ' || (published_at = now()) from public.trenerzy where id = 't9-a-tr')),
  'published true / published true',
  'admin: po publikacji status published i published_at ustawione na czas publikacji'
);
select lives_ok(
  $$update public.szkolenie_trener set sort_order_trener = 4, sort_order_szkolenie = 5
    where szkolenie_id = 't9-a-szk' and trener_id = 't9-a-tr'$$,
  'admin: zmienia kolejność w przypisaniu'
);
select is(
  (select sort_order_trener || ' ' || sort_order_szkolenie from public.szkolenie_trener
   where szkolenie_id = 't9-a-szk' and trener_id = 't9-a-tr'),
  '4 5',
  'admin: zmiana przypisania zapisana'
);
select lives_ok(
  $$update public.szkolenia set status = 'draft' where id = 't9-a-szk'$$,
  'admin: wycofuje szkolenie do szkicu'
);
select lives_ok(
  $$update public.trenerzy set status = 'draft' where id = 't9-a-tr'$$,
  'admin: wycofuje trenera do szkicu'
);
select is(
  (select (select status || ' ' || (published_at is null) from public.szkolenia where id = 't9-a-szk')
       || ' / ' || (select status || ' ' || (published_at is null) from public.trenerzy where id = 't9-a-tr')),
  'draft true / draft true',
  'admin: po wycofaniu status draft i published_at wyczyszczone'
);
select is(
  (select coalesce(string_agg(szkolenie_id || '>' || trener_id || ' ' || sort_order_trener || ' '
      || sort_order_szkolenie, ','), '-')
   from public.szkolenie_trener where szkolenie_id = 't9-a-szk'),
  't9-a-szk>t9-a-tr 4 5',
  'admin: widzi przypisanie między szkicem szkolenia i szkicem trenera'
);
select results_eq(
  $$delete from public.szkolenie_trener where szkolenie_id = 't9-a-szk' and trener_id = 't9-a-tr'
    returning szkolenie_id, trener_id$$,
  $$values ('t9-a-szk'::text, 't9-a-tr'::text)$$,
  'admin: usuwa przypisanie (DELETE zwraca dokładnie ten wiersz)'
);
select is(
  (select count(*)::int from public.szkolenie_trener where szkolenie_id = 't9-a-szk'),
  0,
  'admin: przypisanie usunięte'
);
select lives_ok($$delete from public.szkolenia where id = 't9-a-szk'$$, 'admin: usuwa szkolenie');
select lives_ok($$delete from public.trenerzy where id = 't9-a-tr'$$, 'admin: usuwa trenera');
select is(
  (select (select count(*) from public.szkolenia where id = 't9-a-szk')
       + (select count(*) from public.trenerzy where id = 't9-a-tr'))::int,
  0,
  'admin: szkolenie i trener usunięte'
);
select throws_ok(
  $$select * from public.user_roles$$,
  '42501', 'permission denied for table user_roles',
  'admin: SELECT z user_roles odrzucony'
);
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-4000-a000-000000000902', 'admin')$$,
  '42501', 'permission denied for table user_roles',
  'admin: INSERT do user_roles (nadanie roli innemu kontu) odrzucony'
);
select throws_ok(
  $$update public.user_roles set role = 'admin'$$,
  '42501', 'permission denied for table user_roles',
  'admin: UPDATE user_roles odrzucony'
);
select throws_ok(
  $$delete from public.user_roles$$,
  '42501', 'permission denied for table user_roles',
  'admin: DELETE z user_roles odrzucony'
);

reset role;

-- Stan po wszystkich próbach (jako postgres).
select set_eq(
  $$select user_id, role from public.user_roles$$,
  $$select user_id, role from pg_temp.t9_role_przed$$,
  'po próbach: user_roles bez zmian'
);
select is(
  (select (select count(*) from public.szkolenia where id like 't9-%')
       + (select count(*) from public.trenerzy where id like 't9-%')
       + (select count(*) from public.szkolenie_trener where szkolenie_id like 't9-%'))::int,
  0,
  'po próbach: usunięcia redaktora i admina rzeczywiście w bazie'
);

select * from finish();
rollback;
