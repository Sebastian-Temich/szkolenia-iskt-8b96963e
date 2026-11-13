-- W-03/K1–K3 (T3, #8): dane startowe z supabase/seed.sql po `shctl db reset`.
-- Oczekiwane wartości pochodzą z makiet: src/lib/szkolenia/mock-dane.ts (9 szkoleń) i
-- src/test/dane-z-makiety-trenerzy.ts (6 trenerów, relacja z pola `teach`). Hasła testowe są jawne
-- w README.md („tylko lokalnie”). `diag` wypisuje wynik zapytań do raportu T-8.
begin;
select plan(9);

-- 1. W-03/K1: 9 opublikowanych szkoleń w kolejności makiety, z ceną i terminami (NULL = terminy
--    domyślne z makiety, TERMINY_DOMYSLNE w src/lib/szkolenia/terminy.ts).
select is(
  (select string_agg(sort_order || ' ' || id || ' | ' || cat || ' | ' || icon || ' | ' || title
      || ' | ' || level || ' | ' || hours || ' | ' || format || ' | ' || price || ' | '
      || coalesce(badge, '-') || ' | ' || fundable || ' | ' || status || ' | '
      || coalesce(terms::text, 'NULL') || ' | ' || (published_at is not null),
      E'\n' order by sort_order)
   from public.szkolenia),
  $$1 genai | AI | cpu | Generatywne AI dla biznesu | Podstawowy | 2 dni · 16h | Online / Stacjonarnie | 1490 | Bestseller | true | published | NULL | true
2 esg | ESG | leaf | Raportowanie ESG wg CSRD | Średniozaawansowany | 3 dni · 24h | Stacjonarnie / Online | 2190 | Nowość | true | published | NULL | true
3 eng-b2 | Angielski | languages | Angielski biznesowy B2 | Poziom B2 | 60h · 15 tyg. | Online | 2900 | - | true | published | NULL | true
4 fullstack | Software | code-xml | Fullstack Web Developer | Od podstaw | 120h · 6 mies. | Online | 6900 | Popularne | true | published | NULL | true
5 ai-agents | AI | cpu | Automatyzacja z agentami AI | Zaawansowany | 2 dni · 16h | Online | 1990 | - | true | published | NULL | true
6 co2 | ESG | leaf | Ślad węglowy organizacji | Podstawowy | 1 dzień · 8h | Online | 990 | - | true | published | NULL | true
7 python | Software | code-xml | Python od zera | Od podstaw | 40h · 10 tyg. | Online | 1690 | - | true | published | NULL | true
8 grants | B+R | flask-conical | Pozyskiwanie grantów B+R | Średniozaawansowany | 1 dzień · 8h | Stacjonarnie | 1290 | - | true | published | NULL | true
9 eng-it | Angielski | languages | Angielski techniczny IT | Poziom B2+ | 40h · 10 tyg. | Online | 2200 | - | true | published | NULL | true$$,
  'W-03/K1: 9 opublikowanych szkoleń w kolejności, z cenami i terminami z makiety'
);

-- 2. W-03/K1: treść szkoleń (opis, czego się nauczysz, program, dla kogo) jak w makiecie.
select is(
  (select string_agg(id || ' | ' || opis || ' | ' || array_to_string(learn, ' / ') || ' | '
      || (select string_agg(m ->> 'n' || ' ' || (m ->> 't'), ' / ' order by o)
          from jsonb_array_elements(program) with ordinality as p(m, o))
      || ' | ' || for_whom, E'\n' order by sort_order)
   from public.szkolenia),
  $$genai | ChatGPT, Copilot i narzędzia generatywne w realnej pracy — od promptów po automatyzacje. | Skuteczne prompty i konteksty / Automatyzacja powtarzalnych zadań / Bezpieczne wdrożenie AI w firmie / Budowa własnych asystentów | 01 Wprowadzenie do modeli generatywnych / 02 Prompt engineering w praktyce / 03 Integracje i automatyzacje pracy / 04 Etyka, ryzyka i wdrożenie w organizacji | Dla specjalistów, menedżerów i zespołów, które chcą realnie przyspieszyć pracę dzięki AI — bez wiedzy technicznej.
esg | Przygotuj organizację do obowiązkowego raportowania zrównoważonego rozwoju zgodnie z CSRD. | Wymogi dyrektywy CSRD i ESRS / Zbieranie i walidacja danych ESG / Kalkulacja śladu węglowego / Przygotowanie raportu niefinansowego | 01 Regulacje ESG i dyrektywa CSRD / 02 Standardy raportowania ESRS / 03 Dane, wskaźniki i analiza luk / 04 Struktura raportu i audyt | Dla działów compliance, ESG i finansów firm objętych obowiązkiem raportowania oraz ich dostawców.
eng-b2 | Płynna komunikacja w środowisku międzynarodowym — prezentacje, negocjacje, korespondencja. | Prezentacje i spotkania po angielsku / Negocjacje i e-maile biznesowe / Słownictwo branżowe / Płynność i pewność w mowie | 01 Business communication / 02 Meetings & presentations / 03 Negotiation language / 04 Writing & email etiquette | Dla osób pracujących w środowisku międzynarodowym, które chcą swobodnie porozumiewać się po angielsku.
fullstack | Zostań programistą full-stack — od HTML i JavaScript po backend, bazy danych i chmurę. | HTML, CSS i nowoczesny JavaScript / React i budowa interfejsów / Backend, API i bazy danych / Wdrożenia w chmurze i Git | 01 Frontend — fundamenty / 02 React i zarządzanie stanem / 03 Backend i bazy danych / 04 DevOps i projekt końcowy | Dla osób rozpoczynających karierę w IT oraz przekwalifikowujących się — bez wcześniejszego doświadczenia.
ai-agents | Buduj autonomiczne procesy oparte na agentach AI łączących narzędzia i dane firmy. | Architektura agentów AI / Łączenie narzędzi i API / Automatyzacja procesów end-to-end / Monitoring i bezpieczeństwo | 01 Czym są agenci AI / 02 Projektowanie przepływów / 03 Integracje z systemami firmy / 04 Wdrożenie i utrzymanie | Dla zespołów technicznych i product ownerów wdrażających zaawansowaną automatyzację.
co2 | Policz i ogranicz emisje w zakresie 1, 2 i 3 — praktyczne podejście dla firm. | Zakresy emisji 1, 2 i 3 / Metodyka GHG Protocol / Zbieranie danych emisyjnych / Plan redukcji emisji | 01 Podstawy śladu węglowego / 02 Gromadzenie danych / 03 Kalkulacja i raportowanie / 04 Strategia dekarbonizacji | Dla firm rozpoczynających mierzenie i raportowanie emisji CO2.
python | Pierwszy język programowania — od składni po automatyzację i analizę danych. | Podstawy składni Pythona / Struktury danych i funkcje / Automatyzacja zadań / Wprowadzenie do analizy danych | 01 Zmienne i typy danych / 02 Instrukcje i funkcje / 03 Praca z plikami i API / 04 Mini-projekt automatyzacji | Dla początkujących, którzy chcą nauczyć się programować lub automatyzować pracę.
grants | Zdobądź finansowanie na innowacje — od pomysłu i wniosku po rozliczenie projektu. | Źródła finansowania B+R / Budowa wniosku grantowego / Kwalifikowalność kosztów / Rozliczenie i sprawozdawczość | 01 Mapa dotacji na innowacje / 02 Przygotowanie projektu / 03 Wniosek i budżet / 04 Realizacja i rozliczenie | Dla firm i zespołów R&D planujących projekty badawczo-rozwojowe.
eng-it | Angielski dla specjalistów IT — dokumentacja, code review, spotkania zespołu. | Terminologia techniczna IT / Czytanie dokumentacji / Język code review / Komunikacja w zespole | 01 Tech vocabulary / 02 Reading documentation / 03 Stand-ups & code review / 04 Technical writing | Dla programistów i specjalistów IT pracujących w międzynarodowych zespołach.$$,
  'W-03/K1: opis, efekty, program i grupa docelowa szkoleń jak w makiecie'
);

-- 3. W-03/K2: 6 opublikowanych trenerów w kolejności makiety, bez zdjęć (makieta ma inicjały).
select is(
  (select string_agg(sort_order || ' ' || id || ' | ' || name || ' | ' || initials || ' | '
      || role || ' | ' || array_to_string(areas, ',') || ' | ' || status || ' | '
      || coalesce(photo_url, 'NULL') || ' | ' || jsonb_array_length(experience) || ' | '
      || jsonb_array_length(education) || ' | ' || array_length(skills, 1) || ' | '
      || (published_at is not null), E'\n' order by sort_order)
   from public.trenerzy),
  $$1 nowak | dr Anna Nowak | AN | Head of AI · Trenerka AI | AI,Software | published | NULL | 3 | 2 | 4 | true
2 kowalski | mgr Piotr Kowalski | PK | Ekspert ESG · Doradca CSRD | ESG | published | NULL | 2 | 2 | 4 | true
3 lewandowska | Katarzyna Lewandowska | KL | Lektorka Business English | Angielski | published | NULL | 2 | 2 | 4 | true
4 wisniewski | mgr inż. Tomasz Wiśniewski | TW | Fullstack Developer · Mentor IT | Software | published | NULL | 2 | 2 | 4 | true
5 zielinska | dr Magdalena Zielińska | MZ | Ekspertka B+R · Doradca ds. grantów | B+R | published | NULL | 2 | 2 | 4 | true
6 krol | mgr Jakub Król | JK | Architekt AI · Trener automatyzacji | AI,Software | published | NULL | 2 | 2 | 4 | true$$,
  'W-03/K2: 6 opublikowanych trenerów w kolejności makiety'
);

-- 4. W-03/K2: treść profilu trenera (tagline, bio, doświadczenie, wykształcenie, umiejętności).
select is(
  (select md5(string_agg(id || '|' || tagline || '|' || bio || '|' || experience::text || '|'
      || education::text || '|' || array_to_string(skills, '/'), E'\n' order by sort_order))
   from public.trenerzy),
  (select md5(string_agg(id || '|' || tagline || '|' || bio || '|' || experience::text || '|'
      || education::text || '|' || array_to_string(skills, '/'), E'\n' order by sort_order))
   from (values
     (1, 'nowak',
      'Wdraża generatywne AI w firmach produkcyjnych i usługowych. Uczy praktycznie — od promptu po automatyzację.',
      'Doktor informatyki, praktyk uczenia maszynowego z 12-letnim doświadczeniem. Prowadziła wdrożenia AI dla firm z listy 500 największych w Polsce. Autorka szkoleń, które przeszło ponad 2 000 specjalistów. Wierzy, że AI ma realnie odciążać ludzi, a nie tylko robić wrażenie.',
      '[{"period":"2021 — obecnie","title":"Head of AI","org":"ISKT Greenovation","desc":"Odpowiada za ofertę szkoleń AI i projekty wdrożeniowe u klientów."},{"period":"2016 — 2021","title":"Senior ML Engineer","org":"Grupa technologiczna (Warszawa)","desc":"Budowa modeli predykcyjnych i systemów rekomendacyjnych dla e-commerce."},{"period":"2014 — 2016","title":"Data Scientist","org":"Startup fintech","desc":"Modele scoringowe i detekcja nadużyć."}]'::jsonb,
      '[{"title":"Doktorat z informatyki","org":"Politechnika Śląska"},{"title":"Certyfikat TensorFlow Developer","org":"Google"}]'::jsonb,
      array['Prompt engineering', 'Automatyzacja procesów', 'Wdrożenia LLM w firmie', 'Uczenie maszynowe']),
     (2, 'kowalski',
      'Prowadzi firmy przez raportowanie ESG i dekarbonizację — od pierwszego pomiaru po gotowy raport.',
      'Konsultant zrównoważonego rozwoju z 10-letnim stażem. Przygotował kilkadziesiąt organizacji do raportowania niefinansowego i obliczania śladu węglowego. Łączy wiedzę regulacyjną z praktyką operacyjną.',
      '[{"period":"2020 — obecnie","title":"Lead ESG Consultant","org":"ISKT Greenovation","desc":"Doradztwo CSRD/ESRS i szkolenia dla działów compliance i finansów."},{"period":"2015 — 2020","title":"Sustainability Manager","org":"Grupa przemysłowa","desc":"Wdrożenie strategii dekarbonizacji i raportowania GHG."}]'::jsonb,
      '[{"title":"Magister ochrony środowiska","org":"Uniwersytet Śląski"},{"title":"Certyfikat GHG Protocol","org":"WRI/WBCSD"}]'::jsonb,
      array['Raportowanie CSRD / ESRS', 'Ślad węglowy (zakresy 1–3)', 'Strategia dekarbonizacji', 'Audyt danych ESG']),
     (3, 'lewandowska',
      'Uczy angielskiego biznesowego i technicznego. Stawia na płynność i pewność w realnych sytuacjach.',
      'Certyfikowana lektorka z 14-letnim doświadczeniem w nauczaniu dorosłych. Specjalizuje się w angielskim dla IT i kadry menedżerskiej. Prowadziła szkolenia dla zespołów w międzynarodowych korporacjach.',
      '[{"period":"2019 — obecnie","title":"Senior Trainer — Business English","org":"ISKT Greenovation","desc":"Kursy B2/C1, angielski techniczny IT i szkolenia zamknięte dla firm."},{"period":"2011 — 2019","title":"Lektorka języka angielskiego","org":"Szkoła językowa","desc":"Kursy ogólne i biznesowe, przygotowanie do egzaminów Cambridge."}]'::jsonb,
      '[{"title":"Filologia angielska","org":"Uniwersytet Jagielloński"},{"title":"Certyfikat CELTA","org":"Cambridge"}]'::jsonb,
      array['Business English', 'Angielski techniczny IT', 'Prezentacje i negocjacje', 'Egzaminy Cambridge']),
     (4, 'wisniewski',
      'Programista fullstack i mentor. Przeprowadza kursantów od zera do pierwszej pracy w IT.',
      'Inżynier oprogramowania z 11-letnim doświadczeniem komercyjnym. Budował aplikacje webowe dla klientów w Polsce i za granicą. Jako mentor pomógł kilkuset osobom rozpocząć karierę w programowaniu.',
      '[{"period":"2020 — obecnie","title":"Lead Instructor — Web Dev","org":"ISKT Greenovation","desc":"Prowadzi bootcamp fullstack oraz kursy Pythona."},{"period":"2013 — 2020","title":"Senior Fullstack Developer","org":"Software house","desc":"Aplikacje React/Node dla klientów międzynarodowych."}]'::jsonb,
      '[{"title":"Magister inżynier informatyki","org":"Politechnika Wrocławska"},{"title":"AWS Certified Developer","org":"Amazon Web Services"}]'::jsonb,
      array['JavaScript / React', 'Node.js i API', 'Python', 'Chmura i wdrożenia']),
     (5, 'zielinska',
      'Pomaga firmom pozyskiwać granty na innowacje — od pomysłu i wniosku po rozliczenie projektu.',
      'Doktor nauk ekonomicznych, specjalistka finansowania innowacji. Pozyskała dla klientów dziesiątki milionów złotych dofinansowania na projekty B+R. Zna realia zarówno wnioskodawcy, jak i instytucji oceniającej.',
      '[{"period":"2018 — obecnie","title":"Doradca ds. B+R i grantów","org":"ISKT Greenovation","desc":"Przygotowanie wniosków grantowych i szkolenia dla zespołów R&D."},{"period":"2012 — 2018","title":"Ekspert oceniający","org":"Instytucja finansująca","desc":"Ocena wniosków o dofinansowanie projektów innowacyjnych."}]'::jsonb,
      '[{"title":"Doktorat z ekonomii","org":"Uniwersytet Ekonomiczny w Katowicach"},{"title":"Certyfikat Project Management (IPMA)","org":"IPMA Polska"}]'::jsonb,
      array['Wnioski grantowe', 'Kwalifikowalność kosztów', 'Zarządzanie projektami B+R', 'Rozliczanie dotacji']),
     (6, 'krol',
      'Projektuje autonomiczne procesy oparte na agentach AI. Uczy, jak łączyć narzędzia i dane firmy.',
      'Architekt rozwiązań AI z 9-letnim doświadczeniem. Wdraża systemy automatyzacji łączące modele językowe z firmowymi systemami. Ceni pragmatyczne podejście: najpierw wartość, potem technologia.',
      '[{"period":"2022 — obecnie","title":"AI Solutions Architect","org":"ISKT Greenovation","desc":"Projektowanie i wdrażanie agentów AI oraz szkolenia zaawansowane."},{"period":"2016 — 2022","title":"Backend / Integration Engineer","org":"Firma SaaS","desc":"Integracje systemów i automatyzacja procesów biznesowych."}]'::jsonb,
      '[{"title":"Magister informatyki","org":"Akademia Górniczo-Hutnicza"},{"title":"Microsoft Certified: Azure AI Engineer","org":"Microsoft"}]'::jsonb,
      array['Architektura agentów AI', 'Integracje i API', 'Automatyzacja end-to-end', 'Bezpieczeństwo wdrożeń'])
   ) as m(sort_order, id, tagline, bio, experience, education, skills)),
  'W-03/K2: tagline, bio, doświadczenie, wykształcenie i umiejętności trenerów jak w makiecie'
);

-- 5. W-03/K2: przypisania z pola `teach` makiety. sort_order_szkolenie = indeks w `teach` trenera,
--    sort_order_trener = kolejność, w jakiej trenerzy makiety wskazują szkolenie (atrapa-klienta.ts).
select is(
  (select string_agg(trener_id || ' -> ' || szkolenie_id || ' | szkolenie ' || sort_order_szkolenie
      || ' | trener ' || sort_order_trener, E'\n' order by t.sort_order, st.sort_order_szkolenie)
   from public.szkolenie_trener st join public.trenerzy t on t.id = st.trener_id),
  $$nowak -> genai | szkolenie 0 | trener 0
nowak -> ai-agents | szkolenie 1 | trener 0
kowalski -> esg | szkolenie 0 | trener 0
kowalski -> co2 | szkolenie 1 | trener 0
lewandowska -> eng-b2 | szkolenie 0 | trener 0
lewandowska -> eng-it | szkolenie 1 | trener 0
wisniewski -> fullstack | szkolenie 0 | trener 0
wisniewski -> python | szkolenie 1 | trener 0
zielinska -> grants | szkolenie 0 | trener 0
krol -> ai-agents | szkolenie 0 | trener 1
krol -> genai | szkolenie 1 | trener 1$$,
  'W-03/K2: przypisania trenerów do szkoleń z makiety, obie kolejności'
);

-- 6. W-03/K3: dwa konta testowe, potwierdzone, logowanie e-mailem; hasło z README.md.
select is(
  (select string_agg(u.email || ' | ' || u.aud || ' | ' || u.role || ' | '
      || (u.email_confirmed_at is not null) || ' | '
      || (u.encrypted_password = extensions.crypt(
            case u.email when 'redaktor@szkolenia.local' then 'redaktor-lokalnie'
                         else 'bez-roli-lokalnie' end, u.encrypted_password)) || ' | '
      || coalesce(u.raw_app_meta_data ->> 'provider', '-') || ' | '
      || (select count(*) from auth.identities i
          where i.user_id = u.id and i.provider = 'email' and i.provider_id = u.id::text),
      E'\n' order by u.email)
   from auth.users u),
  $$bez-roli@szkolenia.local | authenticated | authenticated | true | true | email | 1
redaktor@szkolenia.local | authenticated | authenticated | true | true | email | 1$$,
  'W-03/K3: konta redaktor@ i bez-roli@ z hasłami testowymi z README i tożsamością e-mail'
);

-- 7. W-03/K3: GoTrue odrzuca logowanie, gdy kolumny tokenów są NULL; seed wpisuje puste napisy.
select is(
  (select count(*)::int from auth.users
   where confirmation_token is null or recovery_token is null or email_change_token_new is null
      or email_change is null or email_change_token_current is null
      or reauthentication_token is null or phone_change is null or phone_change_token is null),
  0,
  'W-03/K3: konta testowe bez NULL w kolumnach tokenów (logowanie przez /auth/v1/token)'
);

-- 8. W-03/K3: redaktor ma rolę editor, konto bez roli nie ma żadnej roli.
select is(
  (select string_agg(u.email || ' | ' || coalesce(
      (select string_agg(r.role::text, ',' order by r.role) from public.user_roles r
       where r.user_id = u.id), '-'), E'\n' order by u.email)
   from auth.users u),
  $$bez-roli@szkolenia.local | -
redaktor@szkolenia.local | editor$$,
  'W-03/K3: redaktor@ z rolą editor, bez-roli@ bez roli'
);

-- 9. W-03/K4: seed nie zawiera innych kont niż testowe w domenie szkolenia.local.
select is(
  (select count(*)::int from auth.users where email not like '%@szkolenia.local'),
  0,
  'W-03/K4: wszystkie konta w domenie testowej szkolenia.local'
);

-- Wynik zapytań do raportu T-8.
select diag(string_agg(sort_order || ' ' || id || ' ' || price || ' zł, terms '
  || coalesce(terms::text, 'NULL (TERMINY_DOMYSLNE)') || ', ' || status, E'\n' order by sort_order))
from public.szkolenia;
select diag(string_agg(sort_order || ' ' || id || ' ' || name || ', ' || status, E'\n'
  order by sort_order))
from public.trenerzy;

select * from finish();
rollback;
