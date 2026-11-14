/**
 * Testy charakteryzujące komunikatów walidacji panelu (issue #33, zod 3 → 4).
 * Zapisują komunikaty widoczne dla redaktora w stanie sprzed aktualizacji; po przejściu na zod 4
 * oczekiwania zostają bez zmian.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  pusteSzkolenie,
  pustyTrener,
  schematSzkolenia,
  schematTrenera,
} from "@/lib/panel/walidacja";
import { FormularzLogowania } from "@/components/panel/FormularzLogowania";

vi.mock("@/lib/panel/sesja", () => ({ zaloguj: vi.fn() }));

afterEach(cleanup);

type Wynik = { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } };

/** Pierwszy komunikat dla pola, jak w resolverze react-hook-form (bez criteriaMode „all”). */
function komunikat(wynik: Wynik, sciezka: string): string | undefined {
  return wynik.error?.issues.find((i) => i.path.join(".") === sciezka)?.message;
}

const poprawneSzkolenie = () => ({
  ...pusteSzkolenie(),
  id: "ai-podstawy",
  title: "Tytuł",
  level: "Podstawowy",
  hours: "16 h",
  format: "Online",
  desc: "Opis",
  learn: ["a", "b", "c", "d"],
  program: [{ n: "01", t: "Wstęp" }],
  forWhom: "Dla zespołów",
});

const szkolenie = (nadpisz: Record<string, unknown>) =>
  schematSzkolenia.safeParse({ ...poprawneSzkolenie(), ...nadpisz }) as Wynik;

describe("schemat szkolenia: komunikaty", () => {
  it("poprawne dane przechodzą, a tekst jest przycięty", () => {
    const wynik = schematSzkolenia.safeParse({ ...poprawneSzkolenie(), title: "  Tytuł  " });
    expect(wynik.success).toBe(true);
    expect(wynik.data?.title).toBe("Tytuł");
  });

  it("pusta liczba z pola (NaN) daje „Podaj … jako liczbę.”", () => {
    expect(komunikat(szkolenie({ sortOrder: Number.NaN }), "sortOrder")).toBe(
      "Podaj kolejność jako liczbę.",
    );
    expect(komunikat(szkolenie({ price: Number.NaN }), "price")).toBe("Podaj cena jako liczbę.");
  });

  it("brak liczby daje „To pole jest wymagane.”", () => {
    expect(komunikat(szkolenie({ sortOrder: undefined }), "sortOrder")).toBe(
      "To pole jest wymagane.",
    );
  });

  it("tekst zamiast liczby daje „Podaj … jako liczbę.”", () => {
    expect(komunikat(szkolenie({ price: "abc" }), "price")).toBe("Podaj cena jako liczbę.");
  });

  it("ułamek i liczba ujemna mają własne komunikaty", () => {
    expect(komunikat(szkolenie({ sortOrder: 1.5 }), "sortOrder")).toBe(
      "Kolejność musi być liczbą całkowitą.",
    );
    expect(komunikat(szkolenie({ price: -1 }), "price")).toBe("Cena nie może być ujemna.");
  });

  it("nieznana kategoria i ikona dają „Wybierz …”", () => {
    expect(komunikat(szkolenie({ cat: "X" }), "cat")).toBe("Wybierz kategorię.");
    expect(komunikat(szkolenie({ icon: "X" }), "icon")).toBe("Wybierz ikonę.");
  });

  it("pusty albo z samych spacji tekst daje „To pole jest wymagane.”", () => {
    expect(komunikat(szkolenie({ title: "   " }), "title")).toBe("To pole jest wymagane.");
    expect(komunikat(szkolenie({ id: "" }), "id")).toBe("To pole jest wymagane.");
  });

  it("identyfikator spoza wzorca ma komunikat o dozwolonych znakach", () => {
    expect(komunikat(szkolenie({ id: "Ąb" }), "id")).toBe(
      "Identyfikator może zawierać tylko małe litery bez polskich znaków, cyfry i myślniki, i musi zaczynać się od litery lub cyfry.",
    );
  });

  it("efekty: zła liczba pozycji i pusta pozycja", () => {
    expect(komunikat(szkolenie({ learn: ["a", "b", "c"] }), "learn")).toBe(
      "Podaj dokładnie 4 efekty szkolenia.",
    );
    expect(komunikat(szkolenie({ learn: ["a", " ", "c", "d"] }), "learn.1")).toBe(
      "Uzupełnij tę pozycję.",
    );
  });

  it("program: brak modułów, za dużo modułów i pusty temat", () => {
    expect(komunikat(szkolenie({ program: [] }), "program")).toBe(
      "Dodaj co najmniej jeden moduł programu.",
    );
    const za_duzo = Array.from({ length: 25 }, (_, i) => ({ n: String(i), t: "x" }));
    expect(komunikat(szkolenie({ program: za_duzo }), "program")).toBe(
      "Program może mieć najwyżej 24 moduły.",
    );
    expect(komunikat(szkolenie({ program: [{ n: "01", t: "" }] }), "program.0.t")).toBe(
      "To pole jest wymagane.",
    );
  });

  it("własne terminy bez żadnej linii dają komunikat przy polu terminów", () => {
    expect(
      komunikat(szkolenie({ trybTerminow: "wlasne", terminyTekst: " \n " }), "terminyTekst"),
    ).toBe("Wpisz co najmniej jeden termin albo wybierz inny tryb.");
  });
});

const poprawnyTrener = () => ({
  ...pustyTrener(),
  id: "jan-kowalski",
  name: "Jan Kowalski",
  initials: "JK",
  role: "Trener",
  areas: ["AI"],
  tagline: "Hasło",
  bio: "Bio",
});

const trener = (nadpisz: Record<string, unknown>) =>
  schematTrenera.safeParse({ ...poprawnyTrener(), ...nadpisz }) as Wynik;

describe("schemat trenera: komunikaty", () => {
  it("poprawne dane przechodzą, także z pustym zdjęciem", () => {
    expect(schematTrenera.safeParse(poprawnyTrener()).success).toBe(true);
    expect(trener({ photoUrl: "https://example.com/a.jpg" }).success).toBe(true);
  });

  it("obszary: brak i więcej niż 5", () => {
    expect(komunikat(trener({ areas: [] }), "areas")).toBe("Zaznacz co najmniej jeden obszar.");
    expect(
      komunikat(trener({ areas: ["AI", "ESG", "Angielski", "Software", "B+R", "AI"] }), "areas"),
    ).toBe("Można zaznaczyć najwyżej 5 obszarów.");
  });

  it("zdjęcie spoza http(s) albo nie-adres ma komunikat o pełnym adresie", () => {
    const tresc =
      "Wpisz pełny adres zdjęcia zaczynający się od http:// lub https:// albo zostaw pole puste.";
    expect(komunikat(trener({ photoUrl: "ftp://example.com/a.jpg" }), "photoUrl")).toBe(tresc);
    expect(komunikat(trener({ photoUrl: "zdjecie.jpg" }), "photoUrl")).toBe(tresc);
  });

  it("pusta pozycja doświadczenia daje „To pole jest wymagane.”", () => {
    const wynik = trener({ experience: [{ period: "", title: "t", org: "o", desc: "d" }] });
    expect(komunikat(wynik, "experience.0.period")).toBe("To pole jest wymagane.");
  });
});

describe("formularz logowania: komunikaty", () => {
  it("puste pola dają „Wpisz adres e-mail.” i „Wpisz hasło.”", async () => {
    const user = userEvent.setup();
    render(<FormularzLogowania onZalogowano={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByText("Wpisz adres e-mail.")).toBeVisible();
    expect(screen.getByText("Wpisz hasło.")).toBeVisible();
  });

  it("niepoprawny e-mail daje „Wpisz poprawny adres e-mail.”", async () => {
    const user = userEvent.setup();
    render(<FormularzLogowania onZalogowano={vi.fn()} />);
    await user.type(screen.getByLabelText("E-mail"), "nie-adres");
    await user.type(screen.getByLabelText("Hasło"), "x");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByText("Wpisz poprawny adres e-mail.")).toBeVisible();
  });
});
