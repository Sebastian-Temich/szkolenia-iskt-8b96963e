-- Dane startowe tylko dla bazy lokalnej i CI (W-03, T3). Nigdy dla chmury ani produkcji.
-- Ładuje je `shctl db reset` po migracjach ([db.seed] w supabase/config.toml).
--
-- Źródła (bez danych z chmury):
--   - szkolenia: src/lib/szkolenia/mock-dane.ts (9 szkoleń, kolejność z makiety); `terms` = NULL,
--     czyli terminy domyślne z makiety (TERMINY_DOMYSLNE w src/lib/szkolenia/terminy.ts);
--   - trenerzy i przypisania: src/test/dane-z-makiety-trenerzy.ts (6 trenerów, pole `teach`);
--     trenerzy są fikcyjni (decyzja właściciela, docs/decyzje.md 2026-11-12);
--   - konta testowe: redaktor@szkolenia.local (editor) i bez-roli@szkolenia.local (bez roli),
--     hasła testowe jawne w README.md, „tylko lokalnie”.
-- Sprawdza to supabase/tests/dane_startowe.test.sql (`shctl db test`, CI `baza`).

-- ---------------------------------------------------------------------------------------------
-- Szkolenia (sort_order 1–9 jak w makiecie; published_at ustawia wyzwalacz dotknij_updated_at)
-- ---------------------------------------------------------------------------------------------

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
   null, 'published');

-- ---------------------------------------------------------------------------------------------
-- Trenerzy (fikcyjni, sort_order 1–6 jak w makiecie; bez zdjęć, makieta używa inicjałów)
-- ---------------------------------------------------------------------------------------------

insert into public.trenerzy
  (id, sort_order, name, initials, role, areas, tagline, bio, experience, education, skills, status)
values
  ('nowak', 1, 'dr Anna Nowak', 'AN', 'Head of AI · Trenerka AI', array['AI', 'Software'],
   'Wdraża generatywne AI w firmach produkcyjnych i usługowych. Uczy praktycznie — od promptu po automatyzację.',
   'Doktor informatyki, praktyk uczenia maszynowego z 12-letnim doświadczeniem. Prowadziła wdrożenia AI dla firm z listy 500 największych w Polsce. Autorka szkoleń, które przeszło ponad 2 000 specjalistów. Wierzy, że AI ma realnie odciążać ludzi, a nie tylko robić wrażenie.',
   '[{"period":"2021 — obecnie","title":"Head of AI","org":"ISKT Greenovation","desc":"Odpowiada za ofertę szkoleń AI i projekty wdrożeniowe u klientów."},{"period":"2016 — 2021","title":"Senior ML Engineer","org":"Grupa technologiczna (Warszawa)","desc":"Budowa modeli predykcyjnych i systemów rekomendacyjnych dla e-commerce."},{"period":"2014 — 2016","title":"Data Scientist","org":"Startup fintech","desc":"Modele scoringowe i detekcja nadużyć."}]',
   '[{"title":"Doktorat z informatyki","org":"Politechnika Śląska"},{"title":"Certyfikat TensorFlow Developer","org":"Google"}]',
   array['Prompt engineering', 'Automatyzacja procesów', 'Wdrożenia LLM w firmie',
         'Uczenie maszynowe'],
   'published'),

  ('kowalski', 2, 'mgr Piotr Kowalski', 'PK', 'Ekspert ESG · Doradca CSRD', array['ESG'],
   'Prowadzi firmy przez raportowanie ESG i dekarbonizację — od pierwszego pomiaru po gotowy raport.',
   'Konsultant zrównoważonego rozwoju z 10-letnim stażem. Przygotował kilkadziesiąt organizacji do raportowania niefinansowego i obliczania śladu węglowego. Łączy wiedzę regulacyjną z praktyką operacyjną.',
   '[{"period":"2020 — obecnie","title":"Lead ESG Consultant","org":"ISKT Greenovation","desc":"Doradztwo CSRD/ESRS i szkolenia dla działów compliance i finansów."},{"period":"2015 — 2020","title":"Sustainability Manager","org":"Grupa przemysłowa","desc":"Wdrożenie strategii dekarbonizacji i raportowania GHG."}]',
   '[{"title":"Magister ochrony środowiska","org":"Uniwersytet Śląski"},{"title":"Certyfikat GHG Protocol","org":"WRI/WBCSD"}]',
   array['Raportowanie CSRD / ESRS', 'Ślad węglowy (zakresy 1–3)', 'Strategia dekarbonizacji',
         'Audyt danych ESG'],
   'published'),

  ('lewandowska', 3, 'Katarzyna Lewandowska', 'KL', 'Lektorka Business English',
   array['Angielski'],
   'Uczy angielskiego biznesowego i technicznego. Stawia na płynność i pewność w realnych sytuacjach.',
   'Certyfikowana lektorka z 14-letnim doświadczeniem w nauczaniu dorosłych. Specjalizuje się w angielskim dla IT i kadry menedżerskiej. Prowadziła szkolenia dla zespołów w międzynarodowych korporacjach.',
   '[{"period":"2019 — obecnie","title":"Senior Trainer — Business English","org":"ISKT Greenovation","desc":"Kursy B2/C1, angielski techniczny IT i szkolenia zamknięte dla firm."},{"period":"2011 — 2019","title":"Lektorka języka angielskiego","org":"Szkoła językowa","desc":"Kursy ogólne i biznesowe, przygotowanie do egzaminów Cambridge."}]',
   '[{"title":"Filologia angielska","org":"Uniwersytet Jagielloński"},{"title":"Certyfikat CELTA","org":"Cambridge"}]',
   array['Business English', 'Angielski techniczny IT', 'Prezentacje i negocjacje',
         'Egzaminy Cambridge'],
   'published'),

  ('wisniewski', 4, 'mgr inż. Tomasz Wiśniewski', 'TW', 'Fullstack Developer · Mentor IT',
   array['Software'],
   'Programista fullstack i mentor. Przeprowadza kursantów od zera do pierwszej pracy w IT.',
   'Inżynier oprogramowania z 11-letnim doświadczeniem komercyjnym. Budował aplikacje webowe dla klientów w Polsce i za granicą. Jako mentor pomógł kilkuset osobom rozpocząć karierę w programowaniu.',
   '[{"period":"2020 — obecnie","title":"Lead Instructor — Web Dev","org":"ISKT Greenovation","desc":"Prowadzi bootcamp fullstack oraz kursy Pythona."},{"period":"2013 — 2020","title":"Senior Fullstack Developer","org":"Software house","desc":"Aplikacje React/Node dla klientów międzynarodowych."}]',
   '[{"title":"Magister inżynier informatyki","org":"Politechnika Wrocławska"},{"title":"AWS Certified Developer","org":"Amazon Web Services"}]',
   array['JavaScript / React', 'Node.js i API', 'Python', 'Chmura i wdrożenia'],
   'published'),

  ('zielinska', 5, 'dr Magdalena Zielińska', 'MZ', 'Ekspertka B+R · Doradca ds. grantów',
   array['B+R'],
   'Pomaga firmom pozyskiwać granty na innowacje — od pomysłu i wniosku po rozliczenie projektu.',
   'Doktor nauk ekonomicznych, specjalistka finansowania innowacji. Pozyskała dla klientów dziesiątki milionów złotych dofinansowania na projekty B+R. Zna realia zarówno wnioskodawcy, jak i instytucji oceniającej.',
   '[{"period":"2018 — obecnie","title":"Doradca ds. B+R i grantów","org":"ISKT Greenovation","desc":"Przygotowanie wniosków grantowych i szkolenia dla zespołów R&D."},{"period":"2012 — 2018","title":"Ekspert oceniający","org":"Instytucja finansująca","desc":"Ocena wniosków o dofinansowanie projektów innowacyjnych."}]',
   '[{"title":"Doktorat z ekonomii","org":"Uniwersytet Ekonomiczny w Katowicach"},{"title":"Certyfikat Project Management (IPMA)","org":"IPMA Polska"}]',
   array['Wnioski grantowe', 'Kwalifikowalność kosztów', 'Zarządzanie projektami B+R',
         'Rozliczanie dotacji'],
   'published'),

  ('krol', 6, 'mgr Jakub Król', 'JK', 'Architekt AI · Trener automatyzacji', array['AI', 'Software'],
   'Projektuje autonomiczne procesy oparte na agentach AI. Uczy, jak łączyć narzędzia i dane firmy.',
   'Architekt rozwiązań AI z 9-letnim doświadczeniem. Wdraża systemy automatyzacji łączące modele językowe z firmowymi systemami. Ceni pragmatyczne podejście: najpierw wartość, potem technologia.',
   '[{"period":"2022 — obecnie","title":"AI Solutions Architect","org":"ISKT Greenovation","desc":"Projektowanie i wdrażanie agentów AI oraz szkolenia zaawansowane."},{"period":"2016 — 2022","title":"Backend / Integration Engineer","org":"Firma SaaS","desc":"Integracje systemów i automatyzacja procesów biznesowych."}]',
   '[{"title":"Magister informatyki","org":"Akademia Górniczo-Hutnicza"},{"title":"Microsoft Certified: Azure AI Engineer","org":"Microsoft"}]',
   array['Architektura agentów AI', 'Integracje i API', 'Automatyzacja end-to-end',
         'Bezpieczeństwo wdrożeń'],
   'published');

-- ---------------------------------------------------------------------------------------------
-- Przypisania z pola `teach` makiety (jak przypisaniaZMakiety w src/test/atrapa-klienta.ts):
--   sort_order_szkolenie = indeks szkolenia w `teach` trenera,
--   sort_order_trener    = kolejność, w jakiej trenerzy makiety wskazują dane szkolenie.
-- ---------------------------------------------------------------------------------------------

insert into public.szkolenie_trener
  (szkolenie_id, trener_id, sort_order_trener, sort_order_szkolenie)
values
  ('genai', 'nowak', 0, 0),
  ('ai-agents', 'nowak', 0, 1),
  ('esg', 'kowalski', 0, 0),
  ('co2', 'kowalski', 0, 1),
  ('eng-b2', 'lewandowska', 0, 0),
  ('eng-it', 'lewandowska', 0, 1),
  ('fullstack', 'wisniewski', 0, 0),
  ('python', 'wisniewski', 0, 1),
  ('grants', 'zielinska', 0, 0),
  ('ai-agents', 'krol', 1, 0),
  ('genai', 'krol', 1, 1);

-- ---------------------------------------------------------------------------------------------
-- Konta testowe (TYLKO LOKALNIE). Rejestracja jest wyłączona (enable_signup = false), więc konta
-- zakłada seed. Kolumny tokenów to puste napisy, bo GoTrue nie loguje kont z NULL w tych polach.
-- ---------------------------------------------------------------------------------------------

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new, email_change,
   email_change_token_current, reauthentication_token, phone_change, phone_change_token)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-00000000e001',
   'authenticated', 'authenticated', 'redaktor@szkolenia.local',
   extensions.crypt('redaktor-lokalnie', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-00000000e002',
   'authenticated', 'authenticated', 'bez-roli@szkolenia.local',
   extensions.crypt('bez-roli-lokalnie', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', '');

insert into auth.identities
  (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email in ('redaktor@szkolenia.local', 'bez-roli@szkolenia.local');

-- Rola redakcyjna tylko dla redaktora; bez-roli@ celowo bez wpisu (ekran „Brak uprawnień”).
insert into public.user_roles (user_id, role)
values ('00000000-0000-4000-8000-00000000e001', 'editor');
