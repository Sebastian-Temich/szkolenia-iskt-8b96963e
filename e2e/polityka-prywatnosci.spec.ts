import { expect, test } from "@playwright/test";
import { otworz } from "./pomocnicze";

/**
 * W-13/K1 (issue #47): ze strony głównej klik „Polityka prywatności” w stopce otwiera
 * /polityka-prywatnosci z nagłówkiem i treścią szkicu zaakceptowanego przez właściciela.
 */
test("W-13/K1: odnośnik w stopce strony głównej otwiera politykę prywatności", async ({ page }) => {
  await otworz(page, "/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Polityka prywatności" }).click();

  await expect(page).toHaveURL(/\/polityka-prywatnosci$/);
  await expect(page.getByRole("heading", { level: 1, name: "Polityka prywatności" })).toBeVisible();
  await expect(page.getByText(/^Ostatnia aktualizacja:/)).toBeVisible();
  for (const sekcja of [
    "1. Administrator danych",
    "2. Jakie dane przetwarzamy",
    "3. Cel i podstawa",
    "4. Odbiorcy danych",
    "5. Jak długo przechowujemy dane",
    "6. Twoje prawa",
    "7. Profilowanie i pliki cookie",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: sekcja })).toBeVisible();
  }
  await expect(
    page.getByText(/Administratorem danych osobowych jest ISKT Greenovation Sp\. z o\.o\./),
  ).toBeVisible();
  await expect(page.getByText(/Prezesa Urzędu Ochrony Danych Osobowych/)).toBeVisible();
});
