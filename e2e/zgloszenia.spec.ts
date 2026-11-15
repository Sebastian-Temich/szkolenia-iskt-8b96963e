import { expect, test, type Locator, type Page, type Route } from "@playwright/test";
import { otworz, powazneNaruszeniaAxe } from "./pomocnicze";

/**
 * Issue #46 (W-12): wysyłka zgłoszenia z czterech miejsc. Żądanie do funkcji serwerowej
 * (`/_serverFn/…`) przechwytuje `page.route` i odpowiada udawanym wynikiem, więc żaden e-mail nie
 * wychodzi, a w CI nie jest potrzebny klucz Resend (ADR-004 pkt 6). Odpowiedź to zwykły JSON
 * (`content-type: application/json`) w kopercie `{ result }`, jak odpowiedź funkcji serwerowej.
 */

const ZRODLA = ["kontakt", "zapis", "firma"] as const;
type Zrodlo = (typeof ZRODLA)[number];

type Przechwycone = { zrodla: Zrodlo[][]; liczba: () => number };

/**
 * Przechwytuje wywołania funkcji serwerowej. `zrodla` to wartości pola `zrodlo` znalezione w
 * treści każdego żądania (treść to JSON seroval, więc szukamy wartości w cudzysłowie).
 */
async function przechwycWysylke(
  page: Page,
  odpowiedz: { status?: number; wynik: Record<string, unknown> } = { wynik: { wynik: "ok" } },
  opoznienie?: Promise<void>,
): Promise<Przechwycone> {
  const zrodla: Zrodlo[][] = [];
  await page.route("**/_serverFn/**", async (route: Route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const tresc = route.request().postData() ?? "";
    zrodla.push(ZRODLA.filter((z) => tresc.includes(`"${z}"`)));
    if (opoznienie) await opoznienie;
    // Klient funkcji serwerowej bierze wynik z pola `result` odpowiedzi (koperta
    // `{ result, error, context }`, start-client-core `createServerFn.js`), nie z całej treści.
    await route.fulfill({
      status: odpowiedz.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify({ result: odpowiedz.wynik }),
    });
  });
  return { zrodla, liczba: () => zrodla.length };
}

/** Wypełnia pola osobowe; obszar ustawia, gdy formularz nie ma go z góry. */
async function wypelnij(formularz: Locator, obszar?: string) {
  await formularz.getByLabel("Imię i nazwisko").fill("Janina Testowa");
  await formularz.getByLabel("E-mail").fill("janina@example.com");
  await formularz.getByLabel("Telefon").fill("+48 600 111 222");
  if (obszar) await formularz.getByLabel("Interesujące szkolenie / obszar").selectOption(obszar);
  await formularz.getByLabel("Wiadomość").fill("Proszę o informację o najbliższym terminie.");
  await formularz.getByRole("checkbox", { name: /Wyrażam zgodę/ }).check();
}

const sekcjaKontaktu = (page: Page) => page.locator("#kontakt");

async function otworzOkno(page: Page, adres: string, przycisk: RegExp, tytul: string) {
  await otworz(page, adres);
  await page.getByRole("button", { name: przycisk }).click();
  const okno = page.getByRole("dialog", { name: tytul });
  await expect(okno).toBeVisible();
  await expect(okno.getByLabel("Szkolenie", { exact: true }).locator("option")).not.toHaveCount(1);
  return okno;
}

test.describe("W-12/K8: wysyłka z czterech miejsc ze źródłem zgłoszenia", () => {
  test("/#kontakt wysyła źródło kontakt i pokazuje „Dziękujemy!”", async ({ page }) => {
    const wysylka = await przechwycWysylke(page);
    await otworz(page, "/");
    const formularz = sekcjaKontaktu(page);
    await expect(formularz.getByText(/Formularz zostanie podłączony/)).toHaveCount(0);
    await wypelnij(formularz, "Język angielski");
    await formularz.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
    const naglowek = formularz.getByRole("heading", { name: "Dziękujemy!" });
    await expect(naglowek).toBeVisible();
    await expect(naglowek).toBeFocused();
    await expect(
      formularz.getByText("Zgłoszenie dotarło do nas. Odezwiemy się w ciągu 2 dni roboczych."),
    ).toBeVisible();
    expect(wysylka.zrodla).toEqual([["kontakt"]]);
  });

  test("/szkolenia/genai, okno „Zapisz się” wysyła źródło zapis", async ({ page }) => {
    const wysylka = await przechwycWysylke(page);
    const okno = await otworzOkno(
      page,
      "/szkolenia/genai",
      /Zapisz się na szkolenie/,
      "Zapisz się na szkolenie",
    );
    // Review PR #49: obszar ustawiony z góry według kategorii szkolenia, bez ręcznego wyboru.
    await expect(okno.getByLabel("Interesujące szkolenie / obszar")).toHaveValue(
      "AI i narzędzia generatywne",
    );
    await wypelnij(okno);
    await okno.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
    await expect(okno.getByRole("heading", { name: "Dziękujemy!" })).toBeVisible();
    expect(wysylka.zrodla).toEqual([["zapis"]]);
    await okno.getByRole("button", { name: "Zamknij", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("/szkolenia/genai, okno „Zapytaj o termin dla firmy” wysyła źródło firma", async ({
    page,
  }) => {
    const wysylka = await przechwycWysylke(page);
    const okno = await otworzOkno(
      page,
      "/szkolenia/genai",
      /Zapytaj o termin dla firmy/,
      "Zapytaj o termin dla firmy",
    );
    await wypelnij(okno);
    await okno.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
    await expect(okno.getByRole("heading", { name: "Dziękujemy!" })).toBeVisible();
    expect(wysylka.zrodla).toEqual([["firma"]]);
  });

  test("/trenerzy/zielinska, okno „Zapytaj o termin” wysyła źródło firma", async ({ page }) => {
    const wysylka = await przechwycWysylke(page);
    const okno = await otworzOkno(
      page,
      "/trenerzy/zielinska",
      /Zapytaj o termin/,
      "Zapytaj o termin dla firmy",
    );
    await expect(okno.getByLabel("Szkolenie", { exact: true })).toHaveValue("grants");
    await okno.getByLabel("Imię i nazwisko").fill("Janina Testowa");
    await okno.getByLabel("E-mail").fill("janina@example.com");
    await okno.getByLabel("Telefon").fill("600 111 222");
    await okno.getByRole("checkbox", { name: /Wyrażam zgodę/ }).check();
    await okno.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
    await expect(okno.getByRole("heading", { name: "Dziękujemy!" })).toBeVisible();
    expect(wysylka.zrodla).toEqual([["firma"]]);
  });
});

test.describe("W-12/K2, K6: walidacja i trwająca wysyłka", () => {
  test("pusty formularz: komunikaty przy polach, fokus na imieniu, brak żądania", async ({
    page,
  }) => {
    const wysylka = await przechwycWysylke(page);
    await otworz(page, "/");
    const formularz = sekcjaKontaktu(page);
    await formularz.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
    await expect(formularz.getByLabel("Imię i nazwisko")).toBeFocused();
    await expect(formularz.getByLabel("Imię i nazwisko")).toHaveAttribute("aria-invalid", "true");
    for (const komunikat of [
      "Podaj imię i nazwisko.",
      "Podaj poprawny adres e-mail.",
      "Podaj numer telefonu, np. +48 600 000 000.",
      "Wybierz szkolenie lub obszar.",
      "Napisz kilka słów o potrzebie (co najmniej 10 znaków).",
      "Zaznacz zgodę, abyśmy mogli odpowiedzieć.",
      "Uzupełnij zaznaczone pola.",
    ]) {
      await expect(formularz.getByText(komunikat, { exact: true })).toBeVisible();
    }
    expect(wysylka.liczba()).toBe(0);
    expect(await powazneNaruszeniaAxe(page)).toEqual([]);
  });

  test("w trakcie wysyłki „Wysyłam…” zablokowany i jedno żądanie mimo ponownego kliknięcia", async ({
    page,
  }) => {
    let zwolnij: () => void = () => undefined;
    const opoznienie = new Promise<void>((r) => (zwolnij = r));
    const wysylka = await przechwycWysylke(page, undefined, opoznienie);
    await otworz(page, "/");
    const formularz = sekcjaKontaktu(page);
    await wypelnij(formularz, "Projekty B+R");
    await formularz.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
    const wTrakcie = formularz.getByRole("button", { name: "Wysyłam…" });
    await expect(wTrakcie).toBeDisabled();
    await wTrakcie.click({ force: true });
    // Drugie wysłanie formularza z pominięciem przycisku (np. Enter w polu) też nie wysyła.
    await formularz.locator("form").evaluate((f: HTMLFormElement) => f.requestSubmit());
    expect(await powazneNaruszeniaAxe(page)).toEqual([]);
    zwolnij();
    await expect(formularz.getByRole("heading", { name: "Dziękujemy!" })).toBeVisible();
    expect(wysylka.liczba()).toBe(1);
    expect(await powazneNaruszeniaAxe(page)).toEqual([]);
  });
});

test.describe("Bez JavaScriptu (review PR #49)", () => {
  test.use({ javaScriptEnabled: false });

  test("/#kontakt: przycisk wyłączony, Enter i klik nie wysyłają danych ani nie dopisują ich do adresu", async ({
    page,
  }) => {
    const zadania: { url: string; metoda: string; tresc: string }[] = [];
    page.on("request", (r) =>
      zadania.push({ url: r.url(), metoda: r.method(), tresc: r.postData() ?? "" }),
    );
    await otworz(page, "/");
    const adresPrzed = page.url();
    const formularz = sekcjaKontaktu(page);
    await expect(formularz.locator("form")).toHaveAttribute("method", "post");
    await expect(formularz.locator("form")).not.toHaveAttribute("action", /.*/);
    const przycisk = formularz.getByRole("button", { name: "Wyślij zgłoszenie" });
    await expect(przycisk).toBeDisabled();
    await expect(
      formularz.getByText(
        "Wysłanie formularza wymaga włączonego JavaScriptu. Napisz do nas: szkolenia@iskt.pl.",
      ),
    ).toBeVisible();

    const zadaniaPrzed = zadania.length;
    await formularz.getByLabel("Imię i nazwisko").fill("Janina Testowa");
    await formularz.getByLabel("E-mail").fill("janina@example.com");
    await formularz.getByLabel("Telefon").fill("+48 600 111 222");
    await formularz.getByLabel("Wiadomość").fill("Proszę o informację o terminie.");
    await formularz.getByLabel("E-mail").press("Enter");
    await przycisk.click({ force: true });
    await page.waitForLoadState("networkidle");

    expect(page.url()).toBe(adresPrzed);
    expect(page.url()).not.toContain("janina");
    const poWypelnieniu = zadania.slice(zadaniaPrzed);
    expect(poWypelnieniu.filter((z) => z.metoda !== "GET")).toEqual([]);
    for (const z of poWypelnieniu) {
      expect(`${z.url} ${z.tresc}`).not.toMatch(/janina|Testowa|600|Prosz/i);
    }
    await expect(formularz.getByLabel("Imię i nazwisko")).toHaveValue("Janina Testowa");
  });
});

test.describe("W-12/K3, K5: błąd usługi i limit", () => {
  const PRZYPADKI = [
    {
      nazwa: "błąd usługi (502)",
      odpowiedz: { status: 502, wynik: { wynik: "blad" } },
      tekst:
        "Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę albo napisz do nas: szkolenia@iskt.pl.",
    },
    {
      nazwa: "za dużo prób (429)",
      odpowiedz: { status: 429, wynik: { wynik: "limit" } },
      tekst:
        "Wysłano już kilka zgłoszeń. Spróbuj ponownie za kilka minut albo napisz do nas: szkolenia@iskt.pl.",
    },
  ];
  for (const przypadek of PRZYPADKI) {
    test(`${przypadek.nazwa}: komunikat z karty, dane zostają w polach`, async ({ page }) => {
      await przechwycWysylke(page, przypadek.odpowiedz);
      await otworz(page, "/");
      const formularz = sekcjaKontaktu(page);
      await wypelnij(formularz, "Język angielski");
      await formularz.getByRole("button", { name: "Wyślij zgłoszenie" }).click();
      await expect(formularz.getByText(przypadek.tekst)).toBeVisible();
      await expect(formularz.getByLabel("Imię i nazwisko")).toHaveValue("Janina Testowa");
      await expect(formularz.getByLabel("E-mail")).toHaveValue("janina@example.com");
      await expect(formularz.getByRole("button", { name: "Wyślij zgłoszenie" })).toBeEnabled();
      expect(await powazneNaruszeniaAxe(page)).toEqual([]);
    });
  }
});
