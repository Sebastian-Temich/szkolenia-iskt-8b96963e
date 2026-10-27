/**
 * Maszynowy wyciąg z makiety właściciela (`standalone-src.html`, metoda `trainers()`),
 * zrobiony skryptem na źródle, nie przepisany ręcznie. Służy jako oracle treści i jako
 * zbiór danych dla atrapy bazy w testach widoków publicznych.
 *
 * Plik jest danymi, nie konfiguracją — nie edytuj go, żeby test przeszedł.
 * Skrypt: `.work/e02/f/skrypty/wyciag-trenerow.mjs`.
 */
export type TrenerMakiety = {
  id: string;
  name: string;
  initials: string;
  role: string;
  areas: string[];
  /** Identyfikatory szkoleń prowadzonych przez trenera — źródło relacji M:N. */
  teach: string[];
  tagline: string;
  bio: string;
  experience: { period: string; title: string; org: string; desc: string }[];
  education: { title: string; org: string }[];
  skills: string[];
};

export const TRENERZY_MAKIETY: TrenerMakiety[] = [
  {
    id: "nowak",
    name: "dr Anna Nowak",
    initials: "AN",
    role: "Head of AI · Trenerka AI",
    areas: ["AI", "Software"],
    teach: ["genai", "ai-agents"],
    tagline:
      "Wdraża generatywne AI w firmach produkcyjnych i usługowych. Uczy praktycznie — od promptu po automatyzację.",
    bio: "Doktor informatyki, praktyk uczenia maszynowego z 12-letnim doświadczeniem. Prowadziła wdrożenia AI dla firm z listy 500 największych w Polsce. Autorka szkoleń, które przeszło ponad 2 000 specjalistów. Wierzy, że AI ma realnie odciążać ludzi, a nie tylko robić wrażenie.",
    experience: [
      {
        period: "2021 — obecnie",
        title: "Head of AI",
        org: "ISKT Greenovation",
        desc: "Odpowiada za ofertę szkoleń AI i projekty wdrożeniowe u klientów.",
      },
      {
        period: "2016 — 2021",
        title: "Senior ML Engineer",
        org: "Grupa technologiczna (Warszawa)",
        desc: "Budowa modeli predykcyjnych i systemów rekomendacyjnych dla e-commerce.",
      },
      {
        period: "2014 — 2016",
        title: "Data Scientist",
        org: "Startup fintech",
        desc: "Modele scoringowe i detekcja nadużyć.",
      },
    ],
    education: [
      {
        title: "Doktorat z informatyki",
        org: "Politechnika Śląska",
      },
      {
        title: "Certyfikat TensorFlow Developer",
        org: "Google",
      },
    ],
    skills: [
      "Prompt engineering",
      "Automatyzacja procesów",
      "Wdrożenia LLM w firmie",
      "Uczenie maszynowe",
    ],
  },
  {
    id: "kowalski",
    name: "mgr Piotr Kowalski",
    initials: "PK",
    role: "Ekspert ESG · Doradca CSRD",
    areas: ["ESG"],
    teach: ["esg", "co2"],
    tagline:
      "Prowadzi firmy przez raportowanie ESG i dekarbonizację — od pierwszego pomiaru po gotowy raport.",
    bio: "Konsultant zrównoważonego rozwoju z 10-letnim stażem. Przygotował kilkadziesiąt organizacji do raportowania niefinansowego i obliczania śladu węglowego. Łączy wiedzę regulacyjną z praktyką operacyjną.",
    experience: [
      {
        period: "2020 — obecnie",
        title: "Lead ESG Consultant",
        org: "ISKT Greenovation",
        desc: "Doradztwo CSRD/ESRS i szkolenia dla działów compliance i finansów.",
      },
      {
        period: "2015 — 2020",
        title: "Sustainability Manager",
        org: "Grupa przemysłowa",
        desc: "Wdrożenie strategii dekarbonizacji i raportowania GHG.",
      },
    ],
    education: [
      {
        title: "Magister ochrony środowiska",
        org: "Uniwersytet Śląski",
      },
      {
        title: "Certyfikat GHG Protocol",
        org: "WRI/WBCSD",
      },
    ],
    skills: [
      "Raportowanie CSRD / ESRS",
      "Ślad węglowy (zakresy 1–3)",
      "Strategia dekarbonizacji",
      "Audyt danych ESG",
    ],
  },
  {
    id: "lewandowska",
    name: "Katarzyna Lewandowska",
    initials: "KL",
    role: "Lektorka Business English",
    areas: ["Angielski"],
    teach: ["eng-b2", "eng-it"],
    tagline:
      "Uczy angielskiego biznesowego i technicznego. Stawia na płynność i pewność w realnych sytuacjach.",
    bio: "Certyfikowana lektorka z 14-letnim doświadczeniem w nauczaniu dorosłych. Specjalizuje się w angielskim dla IT i kadry menedżerskiej. Prowadziła szkolenia dla zespołów w międzynarodowych korporacjach.",
    experience: [
      {
        period: "2019 — obecnie",
        title: "Senior Trainer — Business English",
        org: "ISKT Greenovation",
        desc: "Kursy B2/C1, angielski techniczny IT i szkolenia zamknięte dla firm.",
      },
      {
        period: "2011 — 2019",
        title: "Lektorka języka angielskiego",
        org: "Szkoła językowa",
        desc: "Kursy ogólne i biznesowe, przygotowanie do egzaminów Cambridge.",
      },
    ],
    education: [
      {
        title: "Filologia angielska",
        org: "Uniwersytet Jagielloński",
      },
      {
        title: "Certyfikat CELTA",
        org: "Cambridge",
      },
    ],
    skills: [
      "Business English",
      "Angielski techniczny IT",
      "Prezentacje i negocjacje",
      "Egzaminy Cambridge",
    ],
  },
  {
    id: "wisniewski",
    name: "mgr inż. Tomasz Wiśniewski",
    initials: "TW",
    role: "Fullstack Developer · Mentor IT",
    areas: ["Software"],
    teach: ["fullstack", "python"],
    tagline:
      "Programista fullstack i mentor. Przeprowadza kursantów od zera do pierwszej pracy w IT.",
    bio: "Inżynier oprogramowania z 11-letnim doświadczeniem komercyjnym. Budował aplikacje webowe dla klientów w Polsce i za granicą. Jako mentor pomógł kilkuset osobom rozpocząć karierę w programowaniu.",
    experience: [
      {
        period: "2020 — obecnie",
        title: "Lead Instructor — Web Dev",
        org: "ISKT Greenovation",
        desc: "Prowadzi bootcamp fullstack oraz kursy Pythona.",
      },
      {
        period: "2013 — 2020",
        title: "Senior Fullstack Developer",
        org: "Software house",
        desc: "Aplikacje React/Node dla klientów międzynarodowych.",
      },
    ],
    education: [
      {
        title: "Magister inżynier informatyki",
        org: "Politechnika Wrocławska",
      },
      {
        title: "AWS Certified Developer",
        org: "Amazon Web Services",
      },
    ],
    skills: ["JavaScript / React", "Node.js i API", "Python", "Chmura i wdrożenia"],
  },
  {
    id: "zielinska",
    name: "dr Magdalena Zielińska",
    initials: "MZ",
    role: "Ekspertka B+R · Doradca ds. grantów",
    areas: ["B+R"],
    teach: ["grants"],
    tagline:
      "Pomaga firmom pozyskiwać granty na innowacje — od pomysłu i wniosku po rozliczenie projektu.",
    bio: "Doktor nauk ekonomicznych, specjalistka finansowania innowacji. Pozyskała dla klientów dziesiątki milionów złotych dofinansowania na projekty B+R. Zna realia zarówno wnioskodawcy, jak i instytucji oceniającej.",
    experience: [
      {
        period: "2018 — obecnie",
        title: "Doradca ds. B+R i grantów",
        org: "ISKT Greenovation",
        desc: "Przygotowanie wniosków grantowych i szkolenia dla zespołów R&D.",
      },
      {
        period: "2012 — 2018",
        title: "Ekspert oceniający",
        org: "Instytucja finansująca",
        desc: "Ocena wniosków o dofinansowanie projektów innowacyjnych.",
      },
    ],
    education: [
      {
        title: "Doktorat z ekonomii",
        org: "Uniwersytet Ekonomiczny w Katowicach",
      },
      {
        title: "Certyfikat Project Management (IPMA)",
        org: "IPMA Polska",
      },
    ],
    skills: [
      "Wnioski grantowe",
      "Kwalifikowalność kosztów",
      "Zarządzanie projektami B+R",
      "Rozliczanie dotacji",
    ],
  },
  {
    id: "krol",
    name: "mgr Jakub Król",
    initials: "JK",
    role: "Architekt AI · Trener automatyzacji",
    areas: ["AI", "Software"],
    teach: ["ai-agents", "genai"],
    tagline:
      "Projektuje autonomiczne procesy oparte na agentach AI. Uczy, jak łączyć narzędzia i dane firmy.",
    bio: "Architekt rozwiązań AI z 9-letnim doświadczeniem. Wdraża systemy automatyzacji łączące modele językowe z firmowymi systemami. Ceni pragmatyczne podejście: najpierw wartość, potem technologia.",
    experience: [
      {
        period: "2022 — obecnie",
        title: "AI Solutions Architect",
        org: "ISKT Greenovation",
        desc: "Projektowanie i wdrażanie agentów AI oraz szkolenia zaawansowane.",
      },
      {
        period: "2016 — 2022",
        title: "Backend / Integration Engineer",
        org: "Firma SaaS",
        desc: "Integracje systemów i automatyzacja procesów biznesowych.",
      },
    ],
    education: [
      {
        title: "Magister informatyki",
        org: "Akademia Górniczo-Hutnicza",
      },
      {
        title: "Microsoft Certified: Azure AI Engineer",
        org: "Microsoft",
      },
    ],
    skills: [
      "Architektura agentów AI",
      "Integracje i API",
      "Automatyzacja end-to-end",
      "Bezpieczeństwo wdrożeń",
    ],
  },
];
