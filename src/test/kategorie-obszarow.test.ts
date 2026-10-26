import { describe, expect, it } from "vitest";
import { KATEGORIE_KOMPETENCJI } from "@/components/strona-glowna/tresci";
import { KATEGORIE_SZKOLEN } from "@/lib/szkolenia/adapter";

/**
 * R4: karty obszarów wiążą się z kategorią po identyfikatorze, nie po pozycji w tablicy.
 * Oczekiwania są wpisane wprost jako pary tytuł-kategoria, a nie liczone z KATEGORIE_SZKOLEN,
 * więc przestawienie kolejności w typy.ts przy wiązaniu pozycyjnym wywróci ten test.
 */
const OCZEKIWANE: [string, string][] = [
  ["Sztuczna inteligencja", "AI"],
  ["ESG i zrównoważony rozwój", "ESG"],
  ["Język angielski", "Angielski"],
  ["Rozwój oprogramowania", "Software"],
  ["Projekty B+R", "B+R"],
];

describe("Karty obszarów kompetencji", () => {
  it("wiąże każdą kartę z jej własną kategorią", () => {
    expect(KATEGORIE_KOMPETENCJI.map((karta) => [karta.tytul, karta.kategoria])).toEqual(OCZEKIWANE);
  });

  it("każda kategoria karty istnieje w zestawie kategorii, niezależnie od jego kolejności", () => {
    for (const karta of KATEGORIE_KOMPETENCJI) {
      expect([...KATEGORIE_SZKOLEN]).toContain(karta.kategoria);
    }
  });

  it("zestaw kategorii to te same pięć wartości bez względu na kolejność", () => {
    expect([...KATEGORIE_SZKOLEN].sort()).toEqual(
      ["AI", "Angielski", "B+R", "ESG", "Software"].sort(),
    );
  });

  it("żadna kategoria nie powtarza się na dwóch kartach", () => {
    const uzyte = KATEGORIE_KOMPETENCJI.map((karta) => karta.kategoria);
    expect(new Set(uzyte).size).toBe(uzyte.length);
  });
});
