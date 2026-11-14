import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Konta z `supabase/seed.sql` (tylko baza lokalna i CI; hasła jawne, testowe, README). */
export const KONTA = {
  redaktor: { email: "redaktor@szkolenia.local", haslo: "Redaktor-lokalnie1" },
  bezRoli: { email: "bez-roli@szkolenia.local", haslo: "Bez-roli-lokalnie1" },
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

/**
 * Naruszenia axe o wadze serious i critical (próg z kryterium issue #20). `pomin` to selektory
 * elementów ze znanym błędem, oznaczonym osobnym `test.fixme` (e2e/dostepnosc.spec.ts); reszta
 * strony jest sprawdzana bez zmian progu.
 */
export async function powazneNaruszeniaAxe(page: Page, pomin: readonly string[] = []) {
  let axe = new AxeBuilder({ page });
  for (const selektor of pomin) axe = axe.exclude(selektor);
  const wynik = await axe.analyze();
  return wynik.violations
    .filter((n) => n.impact === "serious" || n.impact === "critical")
    .map((n) => ({
      regula: n.id,
      waga: n.impact,
      opis: n.help,
      elementy: n.nodes.map((w) => w.target.join(" ")),
    }));
}

/**
 * Szerokość dokumentu nie przekracza szerokości okna, czyli nie ma poziomego przewijania.
 * Komunikat błędu wymienia elementy wystające poza okno (bez przyciętych przez przodka
 * z `overflow` innym niż `visible`), żeby z logu CI było wiadomo, co poprawić (#37).
 */
export async function oczekujBrakuPoziomegoPrzewijania(page: Page) {
  const wymiary = await page.evaluate(() => {
    const okno = document.documentElement.clientWidth;
    const przyciety = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (getComputedStyle(p).overflowX !== "visible") return true;
      }
      return false;
    };
    const opis = (el: Element) => {
      const klasy = typeof el.className === "string" ? el.className.slice(0, 80) : "";
      const tekst = (el.textContent ?? "").trim().slice(0, 40);
      const r = el.getBoundingClientRect();
      return `<${el.tagName.toLowerCase()} class="${klasy}"> „${tekst}” ${Math.round(r.left)}–${Math.round(r.right)} px`;
    };
    const wystajace = Array.from(document.body.querySelectorAll("*"))
      .filter((el) => el.getBoundingClientRect().right > okno + 0.5 && !przyciety(el))
      .filter((el, _, lista) => !lista.some((inny) => inny !== el && el.contains(inny)))
      .slice(0, 5)
      .map(opis);
    return { dokument: document.documentElement.scrollWidth, okno, wystajace };
  });
  expect(
    wymiary.dokument,
    `scrollWidth ${wymiary.dokument} > ${wymiary.okno}; wystają: ${wymiary.wystajace.join("; ") || "brak"}`,
  ).toBeLessThanOrEqual(wymiary.okno);
}
