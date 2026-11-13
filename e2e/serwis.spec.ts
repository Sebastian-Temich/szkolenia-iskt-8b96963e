import { expect, test } from "@playwright/test";
import { otworz } from "./pomocnicze";

/**
 * Publiczny serwis na danych z `supabase/seed.sql` (plan.md O-4, O-5; issue #20).
 * Katalog przejmuje scenariusz dawnego tests/e2e/szkolenia.py.
 */

test.describe("Strona główna (O-4)", () => {
  test("/ pokazuje cztery polecane szkolenia z wyjściem do katalogu", async ({ page }) => {
    await otworz(page, "/");
    const sekcja = page.getByRole("region", { name: "Najczęściej wybierane" });
    const tytuly = sekcja.locator('a[href^="/szkolenia/"] h3');
    await expect(tytuly).toHaveText([
      "Generatywne AI dla biznesu",
      "Raportowanie ESG wg CSRD",
      "Fullstack Web Developer",
      "Angielski biznesowy B2",
    ]);
    await expect(page.getByRole("link", { name: /Cały katalog/ })).toHaveAttribute(
      "href",
      "/szkolenia",
    );
  });
});

test.describe("Katalog /szkolenia (O-4)", () => {
  test("pokazuje 9 kart szkoleń", async ({ page }) => {
    await otworz(page, "/szkolenia");
    await expect(page.getByRole("status")).toHaveText("9 szkoleń");
    await expect(page.getByRole("main").locator('a[href^="/szkolenia/"]:has(h2)')).toHaveCount(9);
  });

  test("filtr kategorii AI zawęża do 2 szkoleń i trafia do adresu", async ({ page }) => {
    await otworz(page, "/szkolenia");
    const ai = page.getByRole("button", { name: "AI", exact: true });
    await ai.click();
    await expect(ai).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status")).toHaveText("2 szkolenia");
    await expect(page.getByRole("main").locator('a[href^="/szkolenia/"]:has(h2)')).toHaveCount(2);
    await expect(page).toHaveURL(/[?&]kategoria=AI(&|$)/);
  });

  test("szukanie, pusty wynik i czyszczenie filtrów", async ({ page }) => {
    await otworz(page, "/szkolenia");
    await page.getByRole("searchbox").fill("zzz");
    await expect(
      page.getByRole("heading", { name: "Brak szkoleń dla tych kryteriów" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Wyczyść filtry" }).click();
    await expect(page.getByRole("status")).toHaveText("9 szkoleń");
    await expect(page.getByRole("searchbox")).toHaveValue("");
  });

  test("powrót ze szczegółu zachowuje filtry katalogu", async ({ page }) => {
    await otworz(page, "/szkolenia");
    await page.getByRole("button", { name: "Software", exact: true }).click();
    await page.getByRole("searchbox").fill("python");
    await expect(page.getByRole("status")).toHaveText("1 szkolenie");
    await page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { name: "Python od zera" }) })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Python od zera");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Katalog", exact: true }).last().click();
    await expect(page.getByRole("status")).toHaveText("1 szkolenie");
    await expect(page.getByRole("searchbox")).toHaveValue("python");
    await expect(page.getByRole("button", { name: "Software", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("nieznane szkolenie daje drogę powrotu do katalogu", async ({ page }) => {
    await otworz(page, "/szkolenia/nie-istnieje");
    await expect(
      page.getByRole("heading", { name: "Nie znaleźliśmy tego szkolenia" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Wróć do katalogu" }).click();
    await expect(page.getByRole("status")).toHaveText("9 szkoleń");
  });
});

test.describe("Szczegół /szkolenia/genai z oknem zapisu (F-04, #18)", () => {
  test.beforeEach(async ({ page }) => {
    await otworz(page, "/szkolenia/genai");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Generatywne AI dla biznesu");
  });

  test("pokazuje prowadzących z odnośnikami do profili (O-5)", async ({ page }) => {
    // Sekcje są zagnieżdżone; najgłębsza z nagłówkiem „Prowadzący” to ostatnie dopasowanie.
    const prowadzacy = page
      .locator("section", { has: page.getByRole("heading", { name: "Prowadzący" }) })
      .last();
    const profile = prowadzacy.locator('a[href^="/trenerzy/"]');
    await expect(profile).toHaveCount(2);
    await expect(profile.nth(0)).toHaveAttribute("href", "/trenerzy/nowak");
    await expect(profile.nth(1)).toHaveAttribute("href", "/trenerzy/krol");
  });

  test("„Zapisz się na szkolenie” otwiera okno z wybranym szkoleniem, bez zmiany adresu", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Zapisz się na szkolenie/ }).click();
    const okno = page.getByRole("dialog", { name: "Zapisz się na szkolenie" });
    await expect(okno).toBeVisible();
    const pole = okno.getByLabel("Szkolenie", { exact: true });
    await expect(pole).toHaveValue("genai");
    await expect(pole.locator("option:checked")).toHaveText("Generatywne AI dla biznesu");
    await expect(pole.locator("option")).toHaveCount(9);
    await expect(okno.getByRole("button", { name: "Osoba indywidualna" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(okno.getByRole("button", { name: /Wyślij zgłoszenie/ })).toBeDisabled();
    await expect(page).toHaveURL(/\/szkolenia\/genai$/);
  });

  test("„Zapytaj o termin dla firmy” otwiera wariant dla firm z tym samym szkoleniem", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Zapytaj o termin dla firmy/ }).click();
    const okno = page.getByRole("dialog", { name: "Zapytaj o termin dla firmy" });
    await expect(okno).toBeVisible();
    await expect(okno.getByLabel("Szkolenie", { exact: true })).toHaveValue("genai");
    await expect(okno.getByRole("button", { name: "Firma" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page).toHaveURL(/\/szkolenia\/genai$/);
  });

  test("Esc zamyka okno, a fokus wraca na przycisk", async ({ page }) => {
    const przycisk = page.getByRole("button", { name: /Zapisz się na szkolenie/ });
    await przycisk.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(przycisk).toBeFocused();
  });
});

test.describe("Trenerzy (O-5)", () => {
  test("/trenerzy pokazuje 6 trenerów, a karta prowadzi na profil", async ({ page }) => {
    await otworz(page, "/trenerzy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Ekspertki i eksperci, którzy Cię poprowadzą",
    );
    const karty = page.getByRole("link", { name: /Zobacz CV/ });
    await expect(karty).toHaveCount(6);
    await karty.first().click();
    await expect(page).toHaveURL(/\/trenerzy\/nowak$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("dr Anna Nowak");
  });

  test("profil /trenerzy/nowak pokazuje CV i prowadzone szkolenia", async ({ page }) => {
    await otworz(page, "/trenerzy/nowak");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("dr Anna Nowak");
    await expect(page.getByRole("heading", { name: "Doświadczenie zawodowe" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Specjalizacje" })).toBeVisible();
    const prowadzi = page
      .locator("section", { has: page.getByRole("heading", { name: "Prowadzi szkolenia" }) })
      .last();
    await expect(prowadzi.locator('a[href^="/szkolenia/"]').first()).toHaveAttribute(
      "href",
      "/szkolenia/genai",
    );
  });
});
