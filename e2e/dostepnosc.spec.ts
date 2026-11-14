import { expect, test, type Page } from "@playwright/test";
import {
  KONTA,
  oczekujBrakuPoziomegoPrzewijania,
  otworz,
  powazneNaruszeniaAxe,
  zaloguj,
} from "./pomocnicze";

/**
 * Dostępność stron z issue #20: brak naruszeń axe o wadze serious i critical oraz brak poziomego
 * przewijania przy szerokości 375 px. Każda strona sprawdzana jest w stanie z danymi.
 */

type Strona = { nazwa: string; przygotuj: (page: Page) => Promise<void> };

const STRONY: Strona[] = [
  {
    nazwa: "/",
    przygotuj: async (page) => {
      await otworz(page, "/");
      await expect(
        page.getByRole("region", { name: "Najczęściej wybierane" }).locator("h3"),
      ).toHaveCount(4);
    },
  },
  {
    nazwa: "/szkolenia",
    przygotuj: async (page) => {
      await otworz(page, "/szkolenia");
      await expect(page.getByRole("status")).toHaveText("9 szkoleń");
    },
  },
  {
    nazwa: "/szkolenia/genai",
    przygotuj: async (page) => {
      await otworz(page, "/szkolenia/genai");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Generatywne AI dla biznesu",
      );
    },
  },
  {
    nazwa: "/szkolenia/genai z otwartym oknem zapisu",
    przygotuj: async (page) => {
      await otworz(page, "/szkolenia/genai");
      await page.getByRole("button", { name: /Zapisz się na szkolenie/ }).click();
      const okno = page.getByRole("dialog", { name: "Zapisz się na szkolenie" });
      await expect(okno).toBeVisible();
      await expect(okno.getByLabel("Szkolenie", { exact: true }).locator("option")).toHaveCount(9);
    },
  },
  {
    nazwa: "/trenerzy",
    przygotuj: async (page) => {
      await otworz(page, "/trenerzy");
      await expect(page.getByRole("link", { name: /Zobacz CV/ })).toHaveCount(6);
    },
  },
  {
    nazwa: "/trenerzy/nowak",
    przygotuj: async (page) => {
      await otworz(page, "/trenerzy/nowak");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("dr Anna Nowak");
    },
  },
  {
    nazwa: "/panel (logowanie)",
    przygotuj: async (page) => {
      await otworz(page, "/panel");
      await expect(page.getByLabel("Hasło", { exact: true })).toBeVisible();
    },
  },
  {
    nazwa: "/panel (redaktor)",
    przygotuj: async (page) => {
      await zaloguj(page, KONTA.redaktor);
      await expect(page.getByText("Generatywne AI dla biznesu").first()).toBeVisible();
    },
  },
  {
    nazwa: "/panel (konto bez roli)",
    przygotuj: async (page) => {
      await zaloguj(page, KONTA.bezRoli);
      await expect(page.getByRole("heading", { level: 1, name: "Brak uprawnień" })).toBeVisible();
    },
  },
];

for (const strona of STRONY) {
  test.describe(strona.nazwa, () => {
    test("axe: brak naruszeń serious i critical", async ({ page }) => {
      await strona.przygotuj(page);
      expect(await powazneNaruszeniaAxe(page)).toEqual([]);
    });

    test("375 px: brak poziomego przewijania i naruszeń axe serious i critical", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await strona.przygotuj(page);
      await oczekujBrakuPoziomegoPrzewijania(page);
      expect(await powazneNaruszeniaAxe(page)).toEqual([]);
    });
  });
}

/** Regresje błędów wykrytych w #20 (CI run 43413245780) i poprawionych w #35. */
test.describe("Regresje dostępności (#35)", () => {
  test("link logo w nagłówku: nazwa dostępna zawiera widoczny tekst", async ({ page }) => {
    await otworz(page, "/");
    const naglowek = page.getByRole("navigation", { name: "Nawigacja główna" });
    await expect(
      naglowek.getByRole("link", { name: /^Rozwijaj swoje kompetencje z ISKT/ }),
    ).toHaveAttribute("href", "/");
    const naruszenia = await powazneNaruszeniaAxe(page);
    expect(naruszenia.filter((n) => n.regula === "label-content-name-mismatch")).toEqual([]);
  });

  test("numery kroków „Jak to działa” mają kontrast co najmniej 4.5:1", async ({ page }) => {
    await otworz(page, "/");
    await expect(page.locator("#jak li").first()).toBeVisible();
    const naruszenia = await powazneNaruszeniaAxe(page);
    expect(naruszenia.filter((n) => n.regula === "color-contrast")).toEqual([]);
  });
});
