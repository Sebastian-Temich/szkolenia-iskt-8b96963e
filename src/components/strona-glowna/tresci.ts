import type { LucideIcon } from "lucide-react";
import {
  Award,
  Banknote,
  BookOpen,
  ClipboardList,
  Handshake,
  Layers,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  KATEGORIE_SZKOLEN,
  type KategoriaSzkolenia,
  type Szkolenie,
} from "@/lib/szkolenia/adapter";
import { IKONY_SZKOLEN } from "@/components/szkolenia/ikony";

/** Audience selected on the home page. */
export type Odbiorca = "individual" | "company";

export const POTWIERDZENIA_HERO = [
  "Dofinansowanie do 80%",
  "Certyfikat ISKT",
  "Zajęcia z ekspertami",
];

/** Returns hero copy for the selected audience. */
export function trescHero(odbiorca: Odbiorca) {
  return odbiorca === "individual"
    ? {
        eyebrow: "Szkolenia ISKT",
        naglowek: "Rozwijaj kompetencje przyszłości.",
        wsparcie:
          "Praktyczne szkolenia z AI, ESG, oprogramowania i języka angielskiego — prowadzone przez ekspertów. Ucz się w swoim tempie, z dofinansowaniem nawet do 80%.",
        cta: "Zapisz się na szkolenie",
      }
    : {
        eyebrow: "Szkolenia dla firm",
        naglowek: "Podnieś kompetencje całego zespołu.",
        wsparcie:
          "Szkolenia szyte na miarę Twojej organizacji — AI, ESG, software i angielski biznesowy. Stacjonarnie lub online, z dofinansowaniem nawet do 80%.",
        cta: "Zapytaj o szkolenie dla firmy",
      };
}

export type Krok = { nr: string; ikona: LucideIcon; tytul: string; opis: string };

const KROKI_INDYWIDUALNE: Krok[] = [
  {
    nr: "01",
    ikona: Search,
    tytul: "Wybierz szkolenie",
    opis: "Przeglądaj katalog i wybierz temat dopasowany do Twoich celów.",
  },
  {
    nr: "02",
    ikona: ClipboardList,
    tytul: "Zapisz się online",
    opis: "Wypełnij formularz i zarezerwuj miejsce w kilka minut.",
  },
  {
    nr: "03",
    ikona: BookOpen,
    tytul: "Ucz się z ekspertem",
    opis: "Praktyczne zajęcia online lub stacjonarnie, z materiałami i nagraniami.",
  },
  {
    nr: "04",
    ikona: Award,
    tytul: "Odbierz certyfikat",
    opis: "Potwierdź nowe kompetencje uznawanym certyfikatem ISKT.",
  },
];
const KROKI_FIRMOWE: Krok[] = [
  {
    nr: "01",
    ikona: Target,
    tytul: "Analiza potrzeb",
    opis: "Bezpłatna konsultacja i audyt kompetencji Twojego zespołu.",
  },
  {
    nr: "02",
    ikona: Layers,
    tytul: "Program na miarę",
    opis: "Projektujemy zakres, format i harmonogram pod cele biznesowe.",
  },
  {
    nr: "03",
    ikona: Handshake,
    tytul: "Realizacja + dofinansowanie",
    opis: "Szkolenie zamknięte u Ciebie lub online, z rozliczeniem KFS/BUR.",
  },
  {
    nr: "04",
    ikona: TrendingUp,
    tytul: "Raport efektów",
    opis: "Mierzymy rezultaty i rekomendujemy dalsze ścieżki rozwoju.",
  },
];

/** Returns process heading and steps for the selected audience. */
export function krokiProcesu(odbiorca: Odbiorca) {
  return odbiorca === "individual"
    ? {
        naglowek: "Od zapisu do certyfikatu w 4 krokach",
        wsparcie: "Prosty proces, który przeprowadzi Cię od wyboru tematu po nowe kompetencje.",
        kroki: KROKI_INDYWIDUALNE,
      }
    : {
        naglowek: "Szkolenie dla zespołu w 4 krokach",
        wsparcie: "Kompleksowo prowadzimy Twoją firmę — od analizy potrzeb po pomiar efektów.",
        kroki: KROKI_FIRMOWE,
      };
}

/** Returns contact heading copy for the selected audience. */
export function trescKontaktu(odbiorca: Odbiorca) {
  return odbiorca === "individual"
    ? {
        naglowek: "Zapisz się na szkolenie",
        wsparcie: "Zostaw kontakt — dobierzemy szkolenie i sprawdzimy dostępne dofinansowanie.",
      }
    : {
        naglowek: "Zapytaj o szkolenie dla firmy",
        wsparcie: "Opowiedz nam o zespole — przygotujemy program i wycenę z dofinansowaniem.",
      };
}

export const POLECANE_ID = ["genai", "esg", "fullstack", "eng-b2"] as const;

/** Picks featured trainings in POLECANE_ID order, skipping missing ids. */
export function wybierzPolecane(lista: Szkolenie[]): Szkolenie[] {
  return POLECANE_ID.map((id) => lista.find((s) => s.id === id)).filter(
    (s): s is Szkolenie => s !== undefined,
  );
}

export type KartaKategorii = {
  kategoria: KategoriaSzkolenia;
  ikona: LucideIcon;
  tytul: string;
  opis: string;
};
/**
 * Wiąże kartę obszaru z kategorią po identyfikatorze, nie po pozycji w KATEGORIE_SZKOLEN.
 * Pozycyjne rozpakowanie tablicy po cichu przypisywało kartom cudze kategorie przy zmianie
 * kolejności w typy.ts; tu zmiana kolejności jest nieszkodliwa, a literówka wywala build.
 */
function kategoria(nazwa: KategoriaSzkolenia): KategoriaSzkolenia {
  const znaleziona = KATEGORIE_SZKOLEN.find((pozycja) => pozycja === nazwa);
  if (!znaleziona) throw new Error(`Nieznana kategoria szkolenia: ${nazwa}`);
  return znaleziona;
}
export const KATEGORIE_KOMPETENCJI: KartaKategorii[] = [
  {
    kategoria: kategoria("AI"),
    ikona: IKONY_SZKOLEN.cpu,
    tytul: "Sztuczna inteligencja",
    opis: "AI w praktyce: narzędzia generatywne, automatyzacja i agenci dla biznesu.",
  },
  {
    kategoria: kategoria("ESG"),
    ikona: IKONY_SZKOLEN.leaf,
    tytul: "ESG i zrównoważony rozwój",
    opis: "Raportowanie CSRD, ślad węglowy i strategia zrównoważonego rozwoju.",
  },
  {
    kategoria: kategoria("Angielski"),
    ikona: IKONY_SZKOLEN.languages,
    tytul: "Język angielski",
    opis: "Angielski biznesowy i techniczny — od poziomu B1 po zaawansowany.",
  },
  {
    kategoria: kategoria("Software"),
    ikona: IKONY_SZKOLEN["code-xml"],
    tytul: "Rozwój oprogramowania",
    opis: "Programowanie, chmura i technologie — od podstaw do wdrożeń.",
  },
  {
    kategoria: kategoria("B+R"),
    ikona: IKONY_SZKOLEN["flask-conical"],
    tytul: "Projekty B+R",
    opis: "Badania, rozwój i granty — komercjalizacja innowacji w Twojej firmie.",
  },
];

export const SCIEZKI = {
  indywidualna: {
    tytul: "Dla osób indywidualnych",
    opis: "Zdobądź certyfikat i realne umiejętności. Elastyczne terminy, dostęp online, mentoring.",
    punkty: [
      "Dofinansowanie BUR do 80%",
      "Certyfikat ukończenia",
      "Nagrania i materiały",
      "Płatność w ratach",
    ],
    cta: "Szkolenia otwarte",
  },
  firmowa: {
    tytul: "Dla firm i zespołów",
    opis: "Program dopasowany do celów biznesowych. Szkolenia zamknięte, audyt kompetencji, dofinansowania.",
    punkty: ["Program na zamówienie", "Rozliczenie KFS / BUR", "Raport efektów"],
    cta: "Szkolenie zamknięte",
  },
};

export const ZRODLA_DOFINANSOWANIA = [
  {
    skrot: "KFS",
    ikona: Banknote,
    tytul: "Krajowy Fundusz Szkoleniowy",
    opis: "Nawet do 100% kosztów dla mikroprzedsiębiorstw i 80% dla pozostałych firm.",
  },
  {
    skrot: "BUR",
    ikona: Wallet,
    tytul: "Baza Usług Rozwojowych",
    opis: "Dofinansowanie z funduszy unijnych — do 80% wartości usługi rozwojowej.",
  },
  {
    skrot: "EFS",
    ikona: ShieldCheck,
    tytul: "Fundusze Europejskie",
    opis: "Projekty regionalne finansujące rozwój kompetencji pracowników.",
  },
];

export const OPCJE_OBSZARU = [
  "AI i narzędzia generatywne",
  "ESG i zrównoważony rozwój",
  "Język angielski",
  "Rozwój oprogramowania",
  "Projekty B+R",
  "Szkolenie zamknięte dla zespołu",
];
