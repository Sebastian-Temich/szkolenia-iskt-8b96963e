import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JakToDziala } from "@/components/strona-glowna/JakToDziala";

afterEach(cleanup);

/**
 * #35 (axe color-contrast, serious): numery kroków 01–04 stały w kolorze surowej palety
 * --green-200 (#D5EBAC) na białej karcie, czyli ok. 1,3:1. Numer ma iść tokenem semantycznym
 * `text-primary`, który `dostepnosc-kontrast.test.ts` sprawdza w obu motywach (≥ 4,5:1 na
 * powierzchni karty). Ten test pilnuje, że numery nie wracają do surowej palety.
 */
describe("Jak to działa: numery kroków", () => {
  it.each(["individual", "company"] as const)(
    "dla odbiorcy %s numery kroków używają tokenu text-primary, nie --green-200",
    (odbiorca) => {
      render(<JakToDziala odbiorca={odbiorca} />);
      const numery = ["01", "02", "03", "04"].map((nr) => screen.getByText(nr));
      for (const numer of numery) {
        expect(numer.className).toMatch(/(^|\s)text-primary(\s|$)/);
        expect(numer.className).not.toContain("--green-200");
      }
    },
  );
});
