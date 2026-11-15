import { z } from "zod";

/**
 * Schemat zgłoszenia z formularza (W-12, „Pola i walidacja”). Ten sam w przeglądarce i na
 * serwerze; serwer rozstrzyga (ADR-004 pkt 1). Moduł nie importuje niczego z przeglądarki ani
 * z bazy, bo czyta go funkcja serwerowa.
 */

/** Obszar formularza dla zapytań firm o szkolenie zamknięte (też domyślny w oknie zapisu #18). */
export const OBSZAR_SZKOLENIE_ZAMKNIETE = "Szkolenie zamknięte dla zespołu";

export const OPCJE_OBSZARU = [
  "AI i narzędzia generatywne",
  "ESG i zrównoważony rozwój",
  "Język angielski",
  "Rozwój oprogramowania",
  "Projekty B+R",
  OBSZAR_SZKOLENIE_ZAMKNIETE,
] as const;

/** Miejsce formularza: sekcja strony głównej, okno „Zapisz się”, okno „Zapytaj o termin dla firmy”. */
export const ZRODLA = ["kontakt", "zapis", "firma"] as const;
export type Zrodlo = (typeof ZRODLA)[number];

/** Nazwa ukrytego pola-pułapki (R8): neutralna, żeby boty ją wypełniały. */
export const POLE_PULAPKI = "strona_www";

/** Komunikaty przy polach z karty W-12 („Pola i walidacja”). */
export const KOMUNIKATY_POL = {
  imie: "Podaj imię i nazwisko.",
  email: "Podaj poprawny adres e-mail.",
  telefon: "Podaj numer telefonu, np. +48 600 000 000.",
  szkolenie: "Wybierz szkolenie.",
  obszar: "Wybierz szkolenie lub obszar.",
  wiadomosc: "Napisz kilka słów o potrzebie (co najmniej 10 znaków).",
  zgoda: "Zaznacz zgodę, abyśmy mogli odpowiedzieć.",
} as const;

export type PoleFormularza = keyof typeof KOMUNIKATY_POL;

/** Kolejność pól w formularzu: pierwsze błędne dostaje fokus. */
export const KOLEJNOSC_POL: readonly PoleFormularza[] = [
  "imie",
  "email",
  "telefon",
  "szkolenie",
  "obszar",
  "wiadomosc",
  "zgoda",
];

const ZNAKI_TELEFONU = /^[0-9 +\-()]+$/;
const ID_SZKOLENIA = /^[A-Za-z0-9_-]{1,100}$/;
const SCIEZKA_STRONY = /^\/[^\s]{0,299}$/;

const telefon = z
  .string()
  .trim()
  .min(9)
  .max(20)
  .regex(ZNAKI_TELEFONU)
  .refine((t) => (t.match(/[0-9]/g) ?? []).length >= 9);

export const schematZgloszenia = z
  .object({
    zrodlo: z.enum(ZRODLA),
    odbiorca: z.enum(["individual", "company"]),
    imie: z.string().trim().min(2).max(120),
    email: z.string().trim().max(254).pipe(z.email()),
    telefon,
    /** Identyfikator szkolenia; tylko w oknie (zapis, firma). */
    szkolenie: z.string().regex(ID_SZKOLENIA).optional(),
    /** Tytuł szkolenia do tematu i treści e-maila (decyzja w raporcie T-46). */
    szkolenieTytul: z.string().trim().min(1).max(200).optional(),
    obszar: z.enum(OPCJE_OBSZARU),
    wiadomosc: z.string().trim().min(10).max(2000),
    zgoda: z.literal(true),
    /** Ścieżka strony, z której wysłano (R5). */
    strona: z.string().regex(SCIEZKA_STRONY),
    [POLE_PULAPKI]: z.string().max(500).optional(),
  })
  .superRefine((dane, ctx) => {
    // Pole „Szkolenie” jest w oknie (zapis, firma) i tam jest wymagane (R1).
    if (dane.zrodlo !== "kontakt" && (!dane.szkolenie || !dane.szkolenieTytul)) {
      ctx.addIssue({ code: "custom", path: ["szkolenie"], message: KOMUNIKATY_POL.szkolenie });
    }
  });

export type Zgloszenie = z.infer<typeof schematZgloszenia>;

export type WynikWalidacji =
  { ok: true; dane: Zgloszenie } | { ok: false; pola: PoleFormularza[]; techniczne: string[] };

/**
 * Sprawdza dane schematem. `pola` to błędne pola formularza w kolejności z formularza;
 * `techniczne` to błędne pola ustawiane przez aplikację (zrodlo, strona, odbiorca).
 */
export function waliduj(dane: unknown): WynikWalidacji {
  const wynik = schematZgloszenia.safeParse(dane);
  if (wynik.success) return { ok: true, dane: wynik.data };
  const nazwy = new Set(wynik.error.issues.map((i) => String(i.path[0] ?? "")));
  const pola = KOLEJNOSC_POL.filter((p) => nazwy.has(p));
  const techniczne = [...nazwy].filter(
    (n) => !(KOLEJNOSC_POL as readonly string[]).includes(n) && NAZWY_TECHNICZNE.has(n),
  );
  return { ok: false, pola, techniczne };
}

const NAZWY_TECHNICZNE = new Set(["zrodlo", "odbiorca", "strona", "szkolenieTytul", POLE_PULAPKI]);

/** Czy wypełniono ukryte pole-pułapkę (R8); sprawdzane przed walidacją. */
export function pulapkaWypelniona(dane: unknown): boolean {
  if (typeof dane !== "object" || dane === null) return false;
  const wartosc = (dane as Record<string, unknown>)[POLE_PULAPKI];
  return typeof wartosc === "string" && wartosc.trim().length > 0;
}
