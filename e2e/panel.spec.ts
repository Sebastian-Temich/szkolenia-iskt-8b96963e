import { expect, test } from "@playwright/test";
import { KONTA, zaloguj } from "./pomocnicze";

/** Panel redakcyjny na kontach z `supabase/seed.sql` (plan.md O-6, O-7; issue #20). */

test("redaktor po zalogowaniu widzi listę szkoleń (O-6)", async ({ page }) => {
  await zaloguj(page, KONTA.redaktor);
  await expect(page.getByRole("heading", { level: 1, name: "Szkolenia" })).toBeVisible();
  await expect(page.getByText(KONTA.redaktor.email)).toBeVisible();
  await expect(page.getByText("Generatywne AI dla biznesu").first()).toBeVisible();
  await expect(page.getByText("Python od zera").first()).toBeVisible();
});

test("konto bez roli widzi „Brak uprawnień” bez listy (O-7)", async ({ page }) => {
  await zaloguj(page, KONTA.bezRoli);
  await expect(page.getByRole("heading", { level: 1, name: "Brak uprawnień" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Wyloguj" })).toBeEnabled();
  await expect(page.getByRole("table")).toHaveCount(0);
});
