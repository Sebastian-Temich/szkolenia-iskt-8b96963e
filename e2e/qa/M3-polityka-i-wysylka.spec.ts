import { expect, test } from "@playwright/test";
import { otworz } from "../pomocnicze";

/**
 * QA M3: przepływ między funkcjami W-13 → W-12. W oknie „Zapisz się na szkolenie” użytkownik
 * wypełnia formularz, otwiera politykę prywatności z odnośnika w zgodzie (nowa karta), wraca do
 * okna i wysyła zgłoszenie. Dane nie mogą zniknąć po otwarciu polityki. Żądanie do funkcji
 * serwerowej przechwytuje `page.route` (bez prawdziwej wysyłki, ADR-004 pkt 6).
 */
test("M3: polityka z okna zapisu w nowej karcie nie gubi danych, wysyłka kończy się „Dziękujemy!”", async ({
  page,
  context,
}) => {
  let wywolania = 0;
  await page.route("**/_serverFn/**", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    wywolania += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { wynik: "ok" } }),
    });
  });

  await otworz(page, "/szkolenia/genai");
  await page.getByRole("button", { name: /Zapisz się na szkolenie/ }).click();
  const okno = page.getByRole("dialog", { name: "Zapisz się na szkolenie" });
  await expect(okno).toBeVisible();

  await okno.getByLabel("Imię i nazwisko").fill("Janina Testowa");
  await okno.getByLabel("E-mail").fill("janina@example.com");
  await okno.getByLabel("Telefon").fill("+48 600 111 222");
  await okno.getByLabel("Wiadomość").fill("Proszę o informację o najbliższym terminie.");

  const [karta] = await Promise.all([
    context.waitForEvent("page"),
    okno
      .getByRole("link", { name: /polityk/i })
      .first()
      .click(),
  ]);
  await karta.waitForLoadState();
  await expect(karta).toHaveURL(/\/polityka-prywatnosci$/);
  await expect(
    karta.getByRole("heading", { name: "Polityka prywatności", level: 1 }),
  ).toBeVisible();
  await karta.close();

  await expect(okno).toBeVisible();
  await expect(okno.getByLabel("Imię i nazwisko")).toHaveValue("Janina Testowa");
  await expect(okno.getByLabel("E-mail")).toHaveValue("janina@example.com");
  await okno.getByRole("checkbox", { name: /Wyrażam zgodę/ }).check();
  await okno.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
  await expect(okno.getByRole("heading", { name: "Dziękujemy!" })).toBeVisible();
  expect(wywolania).toBe(1);
});
