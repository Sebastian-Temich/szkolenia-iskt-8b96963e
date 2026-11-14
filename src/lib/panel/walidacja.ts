import { z } from "zod";
import { KATEGORIE_SZKOLEN } from "@/lib/szkolenia/typy";
import { IKONY_OBSZAROW, type StatusTresci, type SzkoleniePanel, type TrenerPanel } from "./typy";

/* Reguły powtarzają ograniczenia bazy dla wygody redaktora; ochronę danych egzekwuje baza. */

export const WZORZEC_ID = /^[a-z0-9][a-z0-9-]*$/;
const NIEPUSTE = "To pole jest wymagane.";

const tekst = () => z.string().trim().min(1, NIEPUSTE);
const liczbaNieujemna = (nazwa: string) =>
  z
    .number({
      // Jak required_error/invalid_type_error z zod 3: brak wartości albo zły typ (także NaN).
      error: (iss) => (iss.input === undefined ? NIEPUSTE : `Podaj ${nazwa} jako liczbę.`),
    })
    .int(`${nazwa[0]?.toUpperCase()}${nazwa.slice(1)} musi być liczbą całkowitą.`)
    .min(0, `${nazwa[0]?.toUpperCase()}${nazwa.slice(1)} nie może być ujemna.`);

const identyfikator = z
  .string()
  .trim()
  .min(1, NIEPUSTE)
  .regex(
    WZORZEC_ID,
    "Identyfikator może zawierać tylko małe litery bez polskich znaków, cyfry i myślniki, i musi zaczynać się od litery lub cyfry.",
  );

export const TRYBY_TERMINOW = ["domyslne", "brak", "wlasne"] as const;
export type TrybTerminow = (typeof TRYBY_TERMINOW)[number];

/** Rozbija tekst na niepuste linie. */
export function linie(tekstWejsciowy: string): string[] {
  return tekstWejsciowy
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Numer modułu z zerem wiodącym: 1 → „01”. */
export function numerModulu(indeks: number): string {
  return String(indeks + 1).padStart(2, "0");
}

export const schematSzkolenia = z
  .object({
    id: identyfikator,
    sortOrder: liczbaNieujemna("kolejność"),
    cat: z.enum(KATEGORIE_SZKOLEN, { error: "Wybierz kategorię." }),
    icon: z.enum(IKONY_OBSZAROW, { error: "Wybierz ikonę." }),
    title: tekst(),
    level: tekst(),
    hours: tekst(),
    format: tekst(),
    price: liczbaNieujemna("cena"),
    badge: z.string(),
    fundable: z.boolean(),
    desc: tekst(),
    learn: z
      .array(z.string().trim().min(1, "Uzupełnij tę pozycję."))
      .length(4, "Podaj dokładnie 4 efekty szkolenia."),
    program: z
      .array(z.object({ n: tekst(), t: tekst() }))
      .min(1, "Dodaj co najmniej jeden moduł programu.")
      .max(24, "Program może mieć najwyżej 24 moduły."),
    forWhom: tekst(),
    trybTerminow: z.enum(TRYBY_TERMINOW),
    terminyTekst: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.trybTerminow === "wlasne" && linie(v.terminyTekst).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["terminyTekst"],
        message: "Wpisz co najmniej jeden termin albo wybierz inny tryb.",
      });
    }
  });

export type FormularzSzkolenia = z.infer<typeof schematSzkolenia>;

/** Wartości startowe formularza dla nowego szkolenia. */
export function pusteSzkolenie(): FormularzSzkolenia {
  return {
    id: "",
    sortOrder: 0,
    cat: "AI",
    icon: "cpu",
    title: "",
    level: "",
    hours: "",
    format: "",
    price: 0,
    badge: "",
    fundable: false,
    desc: "",
    learn: ["", "", "", ""],
    program: [{ n: "01", t: "" }],
    forWhom: "",
    trybTerminow: "domyslne",
    terminyTekst: "",
  };
}

/** Model panelu na wartości formularza. */
export function szkolenieNaFormularz(s: SzkoleniePanel): FormularzSzkolenia {
  const trybTerminow: TrybTerminow = !s.terms ? "domyslne" : s.terms.length ? "wlasne" : "brak";
  const learn = [0, 1, 2, 3].map((i) => s.learn[i] ?? "");
  return {
    id: s.id,
    sortOrder: s.sortOrder,
    cat: s.cat,
    icon: s.icon,
    title: s.title,
    level: s.level,
    hours: s.hours,
    format: s.format,
    price: s.price,
    badge: s.badge ?? "",
    fundable: s.fundable,
    desc: s.desc,
    learn,
    program: s.program.map((m) => ({ ...m })),
    forWhom: s.forWhom,
    trybTerminow,
    terminyTekst: (s.terms ?? []).join("\n"),
  };
}

/** Zwalidowane wartości formularza na model panelu. */
export function formularzNaSzkolenie(
  f: FormularzSzkolenia,
  redakcja: { status: StatusTresci; publishedAt: string | null },
): SzkoleniePanel {
  const terms =
    f.trybTerminow === "domyslne" ? null : f.trybTerminow === "brak" ? [] : linie(f.terminyTekst);
  return {
    id: f.id,
    sortOrder: f.sortOrder,
    cat: f.cat,
    icon: f.icon,
    title: f.title,
    level: f.level,
    hours: f.hours,
    format: f.format,
    price: f.price,
    badge: f.badge.trim() ? f.badge.trim() : null,
    fundable: f.fundable,
    desc: f.desc,
    learn: [...f.learn],
    program: f.program.map((m, i) => ({ n: numerModulu(i), t: m.t })),
    forWhom: f.forWhom,
    ...(terms ? { terms } : {}),
    status: redakcja.status,
    publishedAt: redakcja.publishedAt,
  };
}

const adresZdjecia = z
  .string()
  .trim()
  .refine(
    (v) => {
      if (v === "") return true;
      try {
        const url = new URL(v);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    {
      message:
        "Wpisz pełny adres zdjęcia zaczynający się od http:// lub https:// albo zostaw pole puste.",
    },
  );

export const schematTrenera = z.object({
  id: identyfikator,
  sortOrder: liczbaNieujemna("kolejność"),
  name: tekst(),
  initials: tekst(),
  role: tekst(),
  areas: z
    .array(z.enum(KATEGORIE_SZKOLEN))
    .min(1, "Zaznacz co najmniej jeden obszar.")
    .max(5, "Można zaznaczyć najwyżej 5 obszarów."),
  tagline: tekst(),
  bio: tekst(),
  experience: z.array(z.object({ period: tekst(), title: tekst(), org: tekst(), desc: tekst() })),
  education: z.array(z.object({ title: tekst(), org: tekst() })),
  skillsTekst: z.string(),
  photoUrl: adresZdjecia,
});

export type FormularzTrenera = z.infer<typeof schematTrenera>;

/** Wartości startowe formularza dla nowego trenera. */
export function pustyTrener(): FormularzTrenera {
  return {
    id: "",
    sortOrder: 0,
    name: "",
    initials: "",
    role: "",
    areas: [],
    tagline: "",
    bio: "",
    experience: [],
    education: [],
    skillsTekst: "",
    photoUrl: "",
  };
}

/** Model trenera na wartości formularza. */
export function trenerNaFormularz(t: TrenerPanel): FormularzTrenera {
  return {
    id: t.id,
    sortOrder: t.sortOrder,
    name: t.name,
    initials: t.initials,
    role: t.role,
    areas: [...t.areas],
    tagline: t.tagline,
    bio: t.bio,
    experience: t.experience.map((e) => ({ ...e })),
    education: t.education.map((e) => ({ ...e })),
    skillsTekst: t.skills.join("\n"),
    photoUrl: t.photoUrl ?? "",
  };
}

/** Zwalidowane wartości formularza trenera na model; puste zdjęcie daje null. */
export function formularzNaTrenera(
  f: FormularzTrenera,
  redakcja: { status: StatusTresci; publishedAt: string | null },
): TrenerPanel {
  return {
    id: f.id,
    sortOrder: f.sortOrder,
    name: f.name,
    initials: f.initials,
    role: f.role,
    areas: [...f.areas],
    tagline: f.tagline,
    bio: f.bio,
    experience: f.experience.map((e) => ({ ...e })),
    education: f.education.map((e) => ({ ...e })),
    skills: linie(f.skillsTekst),
    photoUrl: f.photoUrl.trim() === "" ? null : f.photoUrl.trim(),
    status: redakcja.status,
    publishedAt: redakcja.publishedAt,
  };
}
