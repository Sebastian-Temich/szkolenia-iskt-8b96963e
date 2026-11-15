/**
 * Treść polityki prywatności i krótkiej informacji pod formularzem (W-13). Źródło:
 * `docs/00-intake/zrodla/polityka-prywatnosci.md`, szkic zaakceptowany przez właściciela
 * 2026-11-15 (W-13/K4). Komponenty nie zawierają tekstu polityki, tylko go renderują.
 */

/** Adres strony polityki (W-13, Z4). */
export const ADRES_POLITYKI = "/polityka-prywatnosci" as const;

/** Znacznik pola, które właściciel uzupełni później (issue #47). */
export const DO_UZUPELNIENIA = "[do uzupełnienia]";

/**
 * Dane rejestrowe firmy: JEDYNE miejsce do uzupełnienia przez właściciela. Do tego czasu są
 * widoczne na stronie jako „[do uzupełnienia]”.
 */
export const DANE_FIRMY = {
  nazwa: "ISKT Greenovation Sp. z o.o.",
  /** Miejscownik nazwy miejscowości: „z siedzibą w …”. */
  siedziba: "Żorach",
  adres: DO_UZUPELNIENIA,
  krs: DO_UZUPELNIENIA,
  nip: DO_UZUPELNIENIA,
  email: "szkolenia@iskt.pl",
} as const;

export type SekcjaPolityki = {
  /** Identyfikator kotwicy i nagłówka sekcji. */
  id: string;
  tytul: string;
  /** Akapity przed listą. */
  akapity: string[];
  /** Punkty listy (opcjonalnie). */
  lista?: string[];
  /** Akapity po liście. */
  akapityPo?: string[];
};

export const POLITYKA = {
  tytul: "Polityka prywatności",
  eyebrow: "Ochrona danych",
  /** Data aktualizacji: dzień akceptacji szkicu przez właściciela i wdrożenia strony. */
  aktualizacjaIso: "2026-11-15",
  aktualizacjaTekst: "15 listopada 2026",
  sekcje: [
    {
      id: "administrator",
      tytul: "1. Administrator danych",
      akapity: [
        `Administratorem danych osobowych jest ${DANE_FIRMY.nazwa} z siedzibą w ${DANE_FIRMY.siedziba}` +
          ` (adres: ${DANE_FIRMY.adres}, KRS: ${DANE_FIRMY.krs}, NIP: ${DANE_FIRMY.nip}).` +
          ` Kontakt w sprawach danych osobowych: ${DANE_FIRMY.email}.`,
      ],
    },
    {
      id: "dane",
      tytul: "2. Jakie dane przetwarzamy",
      akapity: [
        "Dane podane w formularzu zgłoszenia: imię i nazwisko, adres e-mail, numer telefonu, wybrane szkolenie lub obszar, treść wiadomości oraz informację, czy zgłaszasz się jako osoba indywidualna, czy w imieniu firmy.",
      ],
    },
    {
      id: "cel",
      tytul: "3. Cel i podstawa",
      akapity: [],
      lista: [
        "Odpowiedź na zgłoszenie i przygotowanie oferty lub zapisu na szkolenie: art. 6 ust. 1 lit. b RODO (działania przed zawarciem umowy na Twoje żądanie).",
        "Prowadzenie korespondencji i ewentualne ustalenie, dochodzenie lub obrona roszczeń: art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes administratora).",
      ],
      akapityPo: [
        "Podanie danych jest dobrowolne, ale bez nich nie możemy odpowiedzieć na zgłoszenie.",
      ],
    },
    {
      id: "odbiorcy",
      tytul: "4. Odbiorcy danych",
      akapity: [
        "Dane z formularza są przesyłane e-mailem przez dostawcę usługi wysyłki poczty (Resend, Inc.) do skrzynki pocztowej administratora. Dane mogą być przetwarzane przez dostawców hostingu strony i poczty działających na zlecenie administratora. Dostawca wysyłki może przetwarzać dane poza Europejskim Obszarem Gospodarczym na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską.",
      ],
    },
    {
      id: "okres",
      tytul: "5. Jak długo przechowujemy dane",
      akapity: [
        "Strona nie zapisuje zgłoszeń w bazie danych. Wiadomość ze zgłoszeniem przechowujemy w skrzynce pocztowej do zakończenia korespondencji, nie dłużej niż 12 miesięcy od ostatniego kontaktu, chyba że dłuższy okres wynika z zawartej umowy lub przepisów prawa.",
      ],
    },
    {
      id: "prawa",
      tytul: "6. Twoje prawa",
      akapity: [
        "Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz prawo sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie." +
          ` Aby skorzystać z praw, napisz na ${DANE_FIRMY.email}. Masz też prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).`,
      ],
    },
    {
      id: "profilowanie",
      tytul: "7. Profilowanie i pliki cookie",
      akapity: [
        "Nie podejmujemy decyzji w sposób zautomatyzowany i nie profilujemy. Strona nie używa narzędzi analitycznych ani reklamowych plików cookie.",
      ],
    },
  ] satisfies SekcjaPolityki[] as readonly SekcjaPolityki[],
};

/** Krótka informacja pod zgodą w formularzu (W-13, „Przebieg” 1). */
export const INFORMACJA_POD_FORMULARZEM = {
  tekst:
    "Administratorem Twoich danych jest ISKT Greenovation Sp. z o.o. Przetwarzamy je, aby odpowiedzieć na zgłoszenie. Szczegóły i Twoje prawa: ",
  odnosnik: "Polityka prywatności",
  koniec: ".",
} as const;

/** Treść zgody z odnośnikiem w słowach „polityką prywatności” (W-13, „Było → ma być”). */
export const ZGODA = {
  przed: "Wyrażam zgodę na kontakt w sprawie zgłoszenia zgodnie z ",
  odnosnik: "polityką prywatności",
  po: " ISKT Greenovation.",
} as const;

/** Dopisek dla czytników ekranu przy odnośniku otwieranym w nowej karcie (okno zapisu). */
export const NOWA_KARTA = " (otwiera się w nowej karcie)";

/** Odnośnik w stopce; „Regulamin” zostaje zwykłym tekstem (W-13, „Poza zakresem”). */
export const STOPKA = { odnosnik: "Polityka prywatności", reszta: " · Regulamin" } as const;
