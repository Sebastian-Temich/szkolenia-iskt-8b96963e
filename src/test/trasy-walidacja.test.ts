import { isNotFound } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route as TrasaKatalogu } from "@/routes/szkolenia/index";
import { Route as TrasaSzczegolu } from "@/routes/szkolenia/$id";
import { Route as TrasaProfiluTrenera } from "@/routes/trenerzy/$id";
import { atrapaMakiety } from "./atrapa-klienta";

/**
 * Loader szczegółu czyta bazę, więc transport jest podstawiony atrapą z treścią makiety.
 * Same opcje tras pozostają produkcyjne.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());

/**
 * Kontrakt adresu: validateSearch obu tras i ścieżka notFound w loaderze szczegółu.
 * Sprawdzane bezpośrednio na opcjach tras, bo to one decydują, co widok dostanie
 * z niezaufanego adresu.
 */
const czytajKatalog = (search: Record<string, unknown>) =>
  (TrasaKatalogu.options.validateSearch as (s: Record<string, unknown>) => Record<string, unknown>)(
    search,
  );
const czytajSzczegol = (search: Record<string, unknown>) =>
  (
    TrasaSzczegolu.options.validateSearch as (s: Record<string, unknown>) => Record<string, unknown>
  )(search);

describe("validateSearch katalogu", () => {
  it("brak parametrów daje Wszystkie i pustą frazę", () => {
    expect(czytajKatalog({})).toEqual({ kategoria: "Wszystkie", q: "" });
  });

  it("przyjmuje każdą z pięciu zatwierdzonych kategorii", () => {
    for (const kategoria of ["AI", "ESG", "Angielski", "Software", "B+R"]) {
      expect(czytajKatalog({ kategoria })).toMatchObject({ kategoria });
    }
  });

  it("odrzuca kategorię spoza listy i nie przepuszcza jej do widoku", () => {
    for (const kategoria of ["AI; DROP", "", "wszystkie", 7, null, { cat: "AI" }, ["AI"]]) {
      expect(czytajKatalog({ kategoria })).toMatchObject({ kategoria: "Wszystkie" });
    }
  });

  it("frazę przyjmuje tylko jako napis", () => {
    expect(czytajKatalog({ q: "python" })).toMatchObject({ q: "python" });
    for (const q of [7, null, undefined, {}, ["a"]]) {
      expect(czytajKatalog({ q })).toMatchObject({ q: "" });
    }
  });

  it("aliasy B+R z surowego adresu wracają do B+R", () => {
    expect(czytajKatalog({ kategoria: decodeURIComponent("B%2BR") })).toMatchObject({
      kategoria: "B+R",
    });
    for (const kategoria of ["B R", "B-R"]) {
      expect(czytajKatalog({ kategoria })).toMatchObject({ kategoria: "B+R" });
    }
  });

  it("nie przepuszcza nieznanych parametrów adresu", () => {
    expect(Object.keys(czytajKatalog({ cokolwiek: "x", kategoria: "AI" })).sort()).toEqual([
      "kategoria",
      "q",
    ]);
  });
});

describe("validateSearch szczegółu", () => {
  it("bez filtrów nie dokłada do adresu pustych wartości", () => {
    expect(czytajSzczegol({})).toEqual({});
  });

  it("przenosi filtry powrotu, gdy są poprawne", () => {
    expect(czytajSzczegol({ kategoria: "Software", q: "python" })).toEqual({
      kategoria: "Software",
      q: "python",
    });
  });

  it("pomija filtr powrotu spoza listy i pustą frazę", () => {
    expect(czytajSzczegol({ kategoria: "Wszystkie", q: "" })).toEqual({});
    expect(czytajSzczegol({ kategoria: "nie-ma", q: 7 })).toEqual({});
  });
});

describe("ścieżka notFound w loaderze szczegółu", () => {
  const uruchom = (id: string) =>
    (TrasaSzczegolu.options.loader as (ctx: { params: { id: string } }) => Promise<unknown>)({
      params: { id },
    });

  it("nieznane id rzuca notFound, a nie zwyczajny błąd", async () => {
    await expect(uruchom("nie-istnieje")).rejects.toSatisfy(isNotFound);
  });

  it("znane id zwraca szkolenie właściciela razem z prowadzącymi", async () => {
    await expect(uruchom("genai")).resolves.toMatchObject({
      szkolenie: { id: "genai", title: "Generatywne AI dla biznesu" },
      trenerzy: [{ id: "nowak" }, { id: "krol" }],
    });
  });
});

describe("ścieżka notFound w loaderze profilu trenera", () => {
  const uruchom = (id: string) =>
    (TrasaProfiluTrenera.options.loader as (ctx: { params: { id: string } }) => Promise<unknown>)({
      params: { id },
    });

  it("nieznane id rzuca notFound, a nie zwyczajny błąd", async () => {
    await expect(uruchom("nie-istnieje")).rejects.toSatisfy(isNotFound);
  });

  it("znane id zwraca profil razem z prowadzonymi szkoleniami", async () => {
    await expect(uruchom("nowak")).resolves.toMatchObject({
      trener: { id: "nowak", name: "dr Anna Nowak" },
      szkolenia: [{ id: "genai" }, { id: "ai-agents" }],
    });
  });
});
