import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Konta z `supabase/seed.sql` (tylko baza lokalna i CI; hasła jawne, testowe, README). */
export const KONTA = {
  redaktor: { email: "redaktor@szkolenia.local", haslo: "redaktor-lokalnie" },
  bezRoli: { email: "bez-roli@szkolenia.local", haslo: "bez-roli-lokalnie" },
} as const;

/**
 * Otwiera adres i czeka, aż strona po SSR skończy pobierać skrypty i dane, czyli aż React
 * przejmie przyciski (hydratacja). Klik przed hydratacją trafia w martwy HTML z serwera.
 */
export async function otworz(page: Page, adres: string) {
  await page.goto(adres);
  await page.waitForLoadState("networkidle");
}

/** Loguje do panelu formularzem z ekranu logowania (`/panel`). */
export async function zaloguj(page: Page, konto: { email: string; haslo: string }) {
  await otworz(page, "/panel");
  await page.getByLabel("E-mail", { exact: true }).fill(konto.email);
  await page.getByLabel("Hasło", { exact: true }).fill(konto.haslo);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
}

/** Naruszenia axe o wadze serious i critical (próg z kryterium issue #20). */
export async function powazneNaruszeniaAxe(page: Page) {
  const wynik = await new AxeBuilder({ page }).analyze();
  return wynik.violations
    .filter((n) => n.impact === "serious" || n.impact === "critical")
    .map((n) => ({
      regula: n.id,
      waga: n.impact,
      opis: n.help,
      elementy: n.nodes.map((w) => w.target.join(" ")),
    }));
}

/** Szerokość dokumentu nie przekracza szerokości okna, czyli nie ma poziomego przewijania. */
export async function oczekujBrakuPoziomegoPrzewijania(page: Page) {
  const wymiary = await page.evaluate(() => ({
    dokument: document.documentElement.scrollWidth,
    okno: document.documentElement.clientWidth,
  }));
  expect(wymiary.dokument, `scrollWidth ${wymiary.dokument} > ${wymiary.okno}`).toBeLessThanOrEqual(
    wymiary.okno,
  );
}
