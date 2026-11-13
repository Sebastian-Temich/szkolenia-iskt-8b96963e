-- QA M1, scenariusz O-9: celowo zepsuty test. Ma zaczerwienić job CI „baza”. Usuwany w kolejnym
-- commicie tego samego PR (QA nie zostawia czerwonego testu na main).
begin;
select plan(1);
select is((select count(*) from public.szkolenia)::int, -1, 'QA O-9: celowo błędne oczekiwanie');
select * from finish();
rollback;
