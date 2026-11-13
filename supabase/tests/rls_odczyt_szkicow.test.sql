-- W-05/K1 (T4, #9; ADR-001 pkt 3): gość (anon) i zalogowany bez roli nie widzą szkiców szkoleń i
-- trenerów ani przypisań, w których którakolwiek strona jest szkicem. Dane tworzy test (prefiks
-- t9-, sort_order 9100+), niezależnie od seedu; asercje „0 szkiców” obejmują całą tabelę.
begin;
select plan(13);

-- Dane testowe (jako postgres, właściciel tabel; RLS go nie dotyczy).
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000901', 't9-bez-roli@example.com', 'authenticated', 'authenticated');

insert into public.szkolenia
  (id, sort_order, cat, icon, title, level, hours, format, price, opis, learn, program, for_whom, status)
values
  ('t9-szk-pub', 9101, 'AI', 'cpu', 'T9 opublikowane', 'Podstawowy', '1 dzień', 'Online', 100,
   'Opis', array['Efekt'], '[{"n":"01","t":"Moduł"}]', 'Dla wszystkich', 'published'),
  ('t9-szk-szkic', 9102, 'ESG', 'leaf', 'T9 szkic', 'Podstawowy', '1 dzień', 'Online', 100,
   'Opis', array['Efekt'], '[{"n":"01","t":"Moduł"}]', 'Dla wszystkich', 'draft');

insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio, status) values
  ('t9-tr-pub', 9101, 'Trener Opublikowany', 'TO', 'Trener', array['AI'], 'Hasło', 'Bio', 'published'),
  ('t9-tr-szkic', 9102, 'Trener Szkic', 'TS', 'Trener', array['ESG'], 'Hasło', 'Bio', 'draft');

insert into public.szkolenie_trener (szkolenie_id, trener_id) values
  ('t9-szk-pub', 't9-tr-pub'),
  ('t9-szk-pub', 't9-tr-szkic'),
  ('t9-szk-szkic', 't9-tr-pub'),
  ('t9-szk-szkic', 't9-tr-szkic');

-- 1. Kontrola danych: właściciel widzi oba szkolenia, obu trenerów i 4 przypisania.
select is(
  (select (select count(*) from public.szkolenia where id like 't9-%') || ' '
       || (select count(*) from public.trenerzy where id like 't9-%') || ' '
       || (select count(*) from public.szkolenie_trener where szkolenie_id like 't9-%')),
  '2 2 4',
  'dane testowe: 2 szkolenia, 2 trenerów, 4 przypisania (wszystkie kombinacje szkic/opublikowane)'
);

-- Gość (anon).
set local role anon;
set local "request.jwt.claims" to '{"role":"anon"}';

select is(
  (select coalesce(string_agg(id, ',' order by id), '-') from public.szkolenia where id like 't9-%'),
  't9-szk-pub',
  'anon: widzi tylko opublikowane szkolenie, bez szkicu'
);
select is(
  (select count(*)::int from public.szkolenia where status <> 'published'),
  0,
  'anon: żadnego szkicu szkolenia w całej tabeli'
);
select is(
  (select coalesce(string_agg(id, ',' order by id), '-') from public.trenerzy where id like 't9-%'),
  't9-tr-pub',
  'anon: widzi tylko opublikowanego trenera, bez szkicu'
);
select is(
  (select count(*)::int from public.trenerzy where status <> 'published'),
  0,
  'anon: żadnego szkicu trenera w całej tabeli'
);
select is(
  (select coalesce(string_agg(szkolenie_id || '>' || trener_id, ',' order by szkolenie_id, trener_id), '-')
   from public.szkolenie_trener where szkolenie_id like 't9-%' or trener_id like 't9-%'),
  't9-szk-pub>t9-tr-pub',
  'anon: widzi tylko przypisanie opublikowane-opublikowany, bez przypisań do szkiców w obie strony'
);

reset role;

-- Zalogowany bez roli.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-4000-a000-000000000901","role":"authenticated"}';

select is(
  (select auth.uid()::text),
  '00000000-0000-4000-a000-000000000901',
  'bez roli: sesja testowa ma auth.uid() konta bez roli'
);
select is(
  (select coalesce(string_agg(id, ',' order by id), '-') from public.szkolenia where id like 't9-%'),
  't9-szk-pub',
  'bez roli: widzi tylko opublikowane szkolenie, bez szkicu'
);
select is(
  (select count(*)::int from public.szkolenia where status <> 'published'),
  0,
  'bez roli: żadnego szkicu szkolenia w całej tabeli'
);
select is(
  (select coalesce(string_agg(id, ',' order by id), '-') from public.trenerzy where id like 't9-%'),
  't9-tr-pub',
  'bez roli: widzi tylko opublikowanego trenera, bez szkicu'
);
select is(
  (select count(*)::int from public.trenerzy where status <> 'published'),
  0,
  'bez roli: żadnego szkicu trenera w całej tabeli'
);
select is(
  (select coalesce(string_agg(szkolenie_id || '>' || trener_id, ',' order by szkolenie_id, trener_id), '-')
   from public.szkolenie_trener where szkolenie_id like 't9-%' or trener_id like 't9-%'),
  't9-szk-pub>t9-tr-pub',
  'bez roli: widzi tylko przypisanie opublikowane-opublikowany, bez przypisań do szkiców w obie strony'
);
select is(
  (select count(*)::int from public.szkolenie_trener st
   where not exists (select 1 from public.szkolenia s where s.id = st.szkolenie_id)
      or not exists (select 1 from public.trenerzy t where t.id = st.trener_id)),
  0,
  'bez roli: każde widoczne przypisanie wskazuje widoczne szkolenie i widocznego trenera'
);

reset role;

select * from finish();
rollback;
