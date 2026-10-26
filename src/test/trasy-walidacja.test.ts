import { isNotFound } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { Route as TrasaKatalogu } from "@/routes/szkolenia/index";
import { Route as TrasaSzczegolu } from "@/routes/szkolenia/$id";

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
    expect(czytajKatalog({})).toEqual({ kategoria: "Wszystkie", q: "", demo: undefined });
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

  it("przełącznik demonstracyjny przyjmuje dokładnie dwie wartości", () => {
    expect(czytajKatalog({ demo: "ladowanie" })).toMatchObject({ demo: "ladowanie" });
    expect(czytajKatalog({ demo: "blad" })).toMatchObject({ demo: "blad" });
    for (const demo of ["Blad", "inne", 1, true]) {
      expect(czytajKatalog({ demo })).toMatchObject({ demo: undefined });
    }
  });

  it("nie przepuszcza nieznanych parametrów adresu", () => {
    expect(Object.keys(czytajKatalog({ cokolwiek: "x", kategoria: "AI" })).sort()).toEqual([
      "demo",
      "kategoria",
      "q",
    ]);
  });
});

describe("validateSearch szczegółu", () => {
  it("bez filtrów nie dokłada do adresu pustych wartości", () => {
    expect(czytajSzczegol({})).toEqual({ demo: undefined });
  });

  it("przenosi filtry powrotu, gdy są poprawne", () => {
    expect(czytajSzczegol({ kategoria: "Software", q: "python" })).toEqual({
      demo: undefined,
      kategoria: "Software",
      q: "python",
    });
  });

  it("pomija filtr powrotu spoza listy i pustą frazę", () => {
    expect(czytajSzczegol({ kategoria: "Wszystkie", q: "" })).toEqual({ demo: undefined });
    expect(czytajSzczegol({ kategoria: "nie-ma", q: 7 })).toEqual({ demo: undefined });
  });
});

describe("ścieżka notFound w loaderze szczegółu", () => {
  const uruchom = (id: string) =>
    (
      TrasaSzczegolu.options.loader as (ctx: {
        params: { id: string };
        deps: { demo: undefined };
      }) => Promise<unknown>
    )({ params: { id }, deps: { demo: undefined } });

  it("nieznane id rzuca notFound, a nie zwyczajny błąd", async () => {
    await expect(uruchom("nie-istnieje")).rejects.toSatisfy(isNotFound);
  });

  it("znane id zwraca szkolenie właściciela", async () => {
    await expect(uruchom("genai")).resolves.toMatchObject({
      id: "genai",
      title: "Generatywne AI dla biznesu",
    });
  });
});
