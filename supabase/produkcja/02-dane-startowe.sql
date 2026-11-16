-- 02-dane-startowe.sql: 9 szkoleń startowych na produkcji (ADR-005 pkt 3, W-16, Z2).
--
-- Uruchamia właściciel w SQL Editor dashboardu Supabase PO `supabase db push` i po 01-sprawdz-baze.sql
-- w trybie 'po-M2' (instrukcja: docs/wydanie/techniczna/produkcja-baza.md).
--
-- Treść 1:1 z sekcji „Szkolenia” w supabase/seed.sql (źródło: src/lib/szkolenia/mock-dane.ts), status
-- 'published'. Bez trenerów, przypisań i kont testowych: te zostają tylko w lokalnym seed.sql.
-- Idempotentny: `on conflict (id) do nothing` pomija szkolenie, które już jest (także zmienione przez
-- redakcję), więc ponowne uruchomienie niczego nie dubluje ani nie nadpisuje.
-- Wynik: lista 9 szkoleń startowych z kolumną status = published.

insert into public.szkolenia
  (id, sort_order, cat, icon, title, level, hours, format, price, badge, fundable, opis, learn,
   program, for_whom, terms, status)
values
  ('genai', 1, 'AI', 'cpu', 'Generatywne AI dla biznesu', 'Podstawowy', '2 dni · 16h',
   'Online / Stacjonarnie', 1490, 'Bestseller', true,
   'ChatGPT, Copilot i narzędzia generatywne w realnej pracy — od promptów po automatyzacje.',
   array['Skuteczne prompty i konteksty', 'Automatyzacja powtarzalnych zadań',
         'Bezpieczne wdrożenie AI w firmie', 'Budowa własnych asystentów'],
   '[{"n":"01","t":"Wprowadzenie do modeli generatywnych"},{"n":"02","t":"Prompt engineering w praktyce"},{"n":"03","t":"Integracje i automatyzacje pracy"},{"n":"04","t":"Etyka, ryzyka i wdrożenie w organizacji"}]',
   'Dla specjalistów, menedżerów i zespołów, które chcą realnie przyspieszyć pracę dzięki AI — bez wiedzy technicznej.',
   null, 'published'),

  ('esg', 2, 'ESG', 'leaf', 'Raportowanie ESG wg CSRD', 'Średniozaawansowany', '3 dni · 24h',
   'Stacjonarnie / Online', 2190, 'Nowość', true,
   'Przygotuj organizację do obowiązkowego raportowania zrównoważonego rozwoju zgodnie z CSRD.',
   array['Wymogi dyrektywy CSRD i ESRS', 'Zbieranie i walidacja danych ESG',
         'Kalkulacja śladu węglowego', 'Przygotowanie raportu niefinansowego'],
   '[{"n":"01","t":"Regulacje ESG i dyrektywa CSRD"},{"n":"02","t":"Standardy raportowania ESRS"},{"n":"03","t":"Dane, wskaźniki i analiza luk"},{"n":"04","t":"Struktura raportu i audyt"}]',
   'Dla działów compliance, ESG i finansów firm objętych obowiązkiem raportowania oraz ich dostawców.',
   null, 'published'),

  ('eng-b2', 3, 'Angielski', 'languages', 'Angielski biznesowy B2', 'Poziom B2', '60h · 15 tyg.',
   'Online', 2900, null, true,
   'Płynna komunikacja w środowisku międzynarodowym — prezentacje, negocjacje, korespondencja.',
   array['Prezentacje i spotkania po angielsku', 'Negocjacje i e-maile biznesowe',
         'Słownictwo branżowe', 'Płynność i pewność w mowie'],
   '[{"n":"01","t":"Business communication"},{"n":"02","t":"Meetings & presentations"},{"n":"03","t":"Negotiation language"},{"n":"04","t":"Writing & email etiquette"}]',
   'Dla osób pracujących w środowisku międzynarodowym, które chcą swobodnie porozumiewać się po angielsku.',
   null, 'published'),

  ('fullstack', 4, 'Software', 'code-xml', 'Fullstack Web Developer', 'Od podstaw',
   '120h · 6 mies.', 'Online', 6900, 'Popularne', true,
   'Zostań programistą full-stack — od HTML i JavaScript po backend, bazy danych i chmurę.',
   array['HTML, CSS i nowoczesny JavaScript', 'React i budowa interfejsów',
         'Backend, API i bazy danych', 'Wdrożenia w chmurze i Git'],
   '[{"n":"01","t":"Frontend — fundamenty"},{"n":"02","t":"React i zarządzanie stanem"},{"n":"03","t":"Backend i bazy danych"},{"n":"04","t":"DevOps i projekt końcowy"}]',
   'Dla osób rozpoczynających karierę w IT oraz przekwalifikowujących się — bez wcześniejszego doświadczenia.',
   null, 'published'),

  ('ai-agents', 5, 'AI', 'cpu', 'Automatyzacja z agentami AI', 'Zaawansowany', '2 dni · 16h',
   'Online', 1990, null, true,
   'Buduj autonomiczne procesy oparte na agentach AI łączących narzędzia i dane firmy.',
   array['Architektura agentów AI', 'Łączenie narzędzi i API',
         'Automatyzacja procesów end-to-end', 'Monitoring i bezpieczeństwo'],
   '[{"n":"01","t":"Czym są agenci AI"},{"n":"02","t":"Projektowanie przepływów"},{"n":"03","t":"Integracje z systemami firmy"},{"n":"04","t":"Wdrożenie i utrzymanie"}]',
   'Dla zespołów technicznych i product ownerów wdrażających zaawansowaną automatyzację.',
   null, 'published'),

  ('co2', 6, 'ESG', 'leaf', 'Ślad węglowy organizacji', 'Podstawowy', '1 dzień · 8h', 'Online',
   990, null, true,
   'Policz i ogranicz emisje w zakresie 1, 2 i 3 — praktyczne podejście dla firm.',
   array['Zakresy emisji 1, 2 i 3', 'Metodyka GHG Protocol', 'Zbieranie danych emisyjnych',
         'Plan redukcji emisji'],
   '[{"n":"01","t":"Podstawy śladu węglowego"},{"n":"02","t":"Gromadzenie danych"},{"n":"03","t":"Kalkulacja i raportowanie"},{"n":"04","t":"Strategia dekarbonizacji"}]',
   'Dla firm rozpoczynających mierzenie i raportowanie emisji CO2.',
   null, 'published'),

  ('python', 7, 'Software', 'code-xml', 'Python od zera', 'Od podstaw', '40h · 10 tyg.', 'Online',
   1690, null, true,
   'Pierwszy język programowania — od składni po automatyzację i analizę danych.',
   array['Podstawy składni Pythona', 'Struktury danych i funkcje', 'Automatyzacja zadań',
         'Wprowadzenie do analizy danych'],
   '[{"n":"01","t":"Zmienne i typy danych"},{"n":"02","t":"Instrukcje i funkcje"},{"n":"03","t":"Praca z plikami i API"},{"n":"04","t":"Mini-projekt automatyzacji"}]',
   'Dla początkujących, którzy chcą nauczyć się programować lub automatyzować pracę.',
   null, 'published'),

  ('grants', 8, 'B+R', 'flask-conical', 'Pozyskiwanie grantów B+R', 'Średniozaawansowany',
   '1 dzień · 8h', 'Stacjonarnie', 1290, null, true,
   'Zdobądź finansowanie na innowacje — od pomysłu i wniosku po rozliczenie projektu.',
   array['Źródła finansowania B+R', 'Budowa wniosku grantowego', 'Kwalifikowalność kosztów',
         'Rozliczenie i sprawozdawczość'],
   '[{"n":"01","t":"Mapa dotacji na innowacje"},{"n":"02","t":"Przygotowanie projektu"},{"n":"03","t":"Wniosek i budżet"},{"n":"04","t":"Realizacja i rozliczenie"}]',
   'Dla firm i zespołów R&D planujących projekty badawczo-rozwojowe.',
   null, 'published'),

  ('eng-it', 9, 'Angielski', 'languages', 'Angielski techniczny IT', 'Poziom B2+', '40h · 10 tyg.',
   'Online', 2200, null, true,
   'Angielski dla specjalistów IT — dokumentacja, code review, spotkania zespołu.',
   array['Terminologia techniczna IT', 'Czytanie dokumentacji', 'Język code review',
         'Komunikacja w zespole'],
   '[{"n":"01","t":"Tech vocabulary"},{"n":"02","t":"Reading documentation"},{"n":"03","t":"Stand-ups & code review"},{"n":"04","t":"Technical writing"}]',
   'Dla programistów i specjalistów IT pracujących w międzynarodowych zespołach.',
   null, 'published')
on conflict (id) do nothing;

select sort_order, id, title, status, published_at is not null as opublikowane
from public.szkolenia
where id in ('genai', 'esg', 'eng-b2', 'fullstack', 'ai-agents', 'co2', 'python', 'grants', 'eng-it')
order by sort_order;
