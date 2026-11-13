-- W-09/K1, W-09/K3 (T6, #25; ADR-003 pkt 2): szkolenia, trenerzy i szkolenie_trener mają dla każdej
-- roli (anon, authenticated) najwyżej jedną permisywną zasadę SELECT, a zasada SELECT oceniana dla
-- anon nie wywołuje funkcji ról (anon nie ma do nich EXECUTE po W-08). Dane tworzy test (prefiks t25-).
begin;
select plan(7);

-- 1. Liczba permisywnych zasad SELECT (cmd SELECT albo ALL) na tabelę i rolę: każda ≤ 1.
select is(
  (select string_agg(t.tabela || ' ' || r.rola || '=' || (
      select count(*) from pg_policies p
      where p.schemaname = 'public' and p.tablename = t.tabela
        and p.permissive = 'PERMISSIVE' and p.cmd in ('SELECT', 'ALL')
        and (r.rola = any (p.roles) or 'public' = any (p.roles))),
    ', ' order by t.tabela, r.rola)
   from (values ('szkolenia'), ('szkolenie_trener'), ('trenerzy')) t(tabela)
   cross join (values ('anon'), ('authenticated')) r(rola)),
  'szkolenia anon=1, szkolenia authenticated=1, szkolenie_trener anon=1, szkolenie_trener authenticated=1, trenerzy anon=1, trenerzy authenticated=1',
  'każda rola ma dokładnie jedną permisywną zasadę SELECT na każdej tabeli treści'
);

-- 2. Zasady SELECT dla anon nie odwołują się do funkcji ról.
select is(
  (select count(*)::int from pg_policies p
   where p.schemaname = 'public' and p.cmd in ('SELECT', 'ALL') and 'anon' = any (p.roles)
     and (p.qual ~ '(is_staff|is_admin|moje_role|has_role)')),
  0,
  'zasady SELECT dla anon bez is_staff/is_admin/moje_role/has_role'
);

-- Dane testowe (jako postgres).
insert into public.szkolenia
  (id, sort_order, cat, icon, title, level, hours, format, price, opis, learn, program, for_whom, status)
values
  ('t25-szk-pub', 9251, 'AI', 'cpu', 'T25 opublikowane', 'Podstawowy', '1 dzień', 'Online', 100,
   'Opis', array['Efekt'], '[{"n":"01","t":"Moduł"}]', 'Dla wszystkich', 'published'),
  ('t25-szk-szkic', 9252, 'ESG', 'leaf', 'T25 szkic', 'Podstawowy', '1 dzień', 'Online', 100,
   'Opis', array['Efekt'], '[{"n":"01","t":"Moduł"}]', 'Dla wszystkich', 'draft');
insert into public.trenerzy (id, sort_order, name, initials, role, areas, tagline, bio, status) values
  ('t25-tr-pub', 9251, 'Trener T25', 'TT', 'Trener', array['AI'], 'Hasło', 'Bio', 'published');
insert into public.szkolenie_trener (szkolenie_id, trener_id) values
  ('t25-szk-pub', 't25-tr-pub'),
  ('t25-szk-szkic', 't25-tr-pub');

-- 3–5. Gość czyta opublikowane bez błędu, choć nie ma EXECUTE do funkcji ról.
set local role anon;
set local "request.jwt.claims" to '{"role":"anon"}';

select lives_ok(
  $$select count(*) from public.szkolenia$$,
  'anon: SELECT ze szkolenia bez błędu uprawnień do funkcji ról'
);
select is(
  (select coalesce(string_agg(id, ',' order by id), '-') from public.szkolenia where id like 't25-%')
   || ' / ' || (select coalesce(string_agg(id, ',' order by id), '-') from public.trenerzy where id like 't25-%'),
  't25-szk-pub / t25-tr-pub',
  'anon: czyta opublikowane szkolenie i trenera, bez szkicu'
);
select is(
  (select coalesce(string_agg(szkolenie_id || '>' || trener_id, ',' order by szkolenie_id), '-')
   from public.szkolenie_trener where trener_id like 't25-%'),
  't25-szk-pub>t25-tr-pub',
  'anon: czyta przypisanie opublikowane-opublikowany bez błędu'
);

reset role;

-- 6–7. Kontrola: odmowa EXECUTE dla anon jest rzeczywista (bez niej test 3 nic by nie dowodził).
select is(
  has_function_privilege('anon', 'public.is_staff()', 'EXECUTE'),
  false,
  'anon: brak EXECUTE na is_staff()'
);
select is(
  has_function_privilege('authenticated', 'public.is_staff()', 'EXECUTE'),
  true,
  'authenticated: EXECUTE na is_staff() zachowane'
);

select * from finish();
rollback;
