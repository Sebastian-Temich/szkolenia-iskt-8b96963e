import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "@tanstack/react-router";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adres, zbudujRouter } from "./harness-routera";
import { atrapaMakiety, biezacaAtrapa } from "./atrapa-klienta";

/**
 * Issue #18 (F-04, „Było → ma być”): oba przyciski karty zapisu na stronie szkolenia otwierają
 * okno z formularzem kontaktu, w którym pole „Szkolenie” ma wybrane oglądane szkolenie.
 * Test wchodzi od trasy; podmieniony jest wyłącznie transport do bazy.
 *
 * Montowanie: korzeń Reacta na `document`, jak w produkcji (powłoka __root renderuje
 * <html> i <body>). `zamontujTrase` montuje w <div> wewnątrz <body>; wtedy każde przejście
 * fokusu między portalem okna (Radix, w <body>) a stroną zapętla react-dom 19.3.1 przy
 * szukaniu korzenia zdarzenia i test wisi bez limitu czasu. To artefakt środowiska testu:
 * z korzeniem na `document` fokus wraca na przycisk tak jak w przeglądarce.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

let korzen: Root | null = null;

beforeEach(() => atrapaMakiety());

afterEach(() => {
  act(() => korzen?.unmount());
  korzen = null;
  vi.unstubAllGlobals();
});

async function zamontujTrase(sciezka: string) {
  const router = zbudujRouter(sciezka);
  await router.load();
  korzen = createRoot(document);
  await act(async () => korzen?.render(<RouterProvider router={router} />));
  return { router };
}

const KOMUNIKAT = "Formularz zostanie podłączony w kolejnym etapie.";

async function otworzOkno(nazwaPrzycisku: RegExp, sciezka = "/szkolenia/genai") {
  const user = userEvent.setup();
  const { router } = await zamontujTrase(sciezka);
  await screen.findByRole("heading", { level: 1 });
  const adresPrzed = adres(router);
  const przycisk = screen.getByRole("button", { name: nazwaPrzycisku });
  await user.click(przycisk);
  const okno = await screen.findByRole("dialog");
  return { user, router, adresPrzed, przycisk, okno };
}

/** Pole „Szkolenie” po wczytaniu listy opublikowanych szkoleń. */
async function poleSzkolenia(okno: HTMLElement) {
  const pole = within(okno).getByLabelText("Szkolenie");
  await waitFor(() => expect(pole.querySelectorAll("option").length).toBeGreaterThan(1));
  return pole as HTMLSelectElement;
}

describe("Okno zapisu na stronie szkolenia (#18)", () => {
  it("„Zapisz się na szkolenie” otwiera okno z wybranym szkoleniem, bez zmiany adresu", async () => {
    const { router, adresPrzed, okno } = await otworzOkno(/Zapisz się na szkolenie/);
    expect(
      within(okno).getByRole("heading", { name: "Zapisz się na szkolenie" }),
    ).toBeInTheDocument();
    expect(okno).toHaveAccessibleName("Zapisz się na szkolenie");
    expect(adres(router)).toBe(adresPrzed);
    expect(adres(router)).toBe("/szkolenia/genai");
    const pole = await poleSzkolenia(okno);
    expect(pole).toHaveValue("genai");
    expect(pole.selectedOptions[0]).toHaveTextContent("Generatywne AI dla biznesu");
    expect(within(okno).getByRole("button", { name: "Osoba indywidualna" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(okno).getByLabelText("Interesujące szkolenie / obszar")).toHaveValue("");
  });

  it("okno ma pola formularza kontaktu z widoczną etykietą", async () => {
    const { okno } = await otworzOkno(/Zapisz się na szkolenie/);
    for (const etykieta of ["Imię i nazwisko", "E-mail", "Telefon", "Szkolenie", "Wiadomość"]) {
      expect(within(okno).getByLabelText(etykieta)).toBeInTheDocument();
    }
    expect(
      within(okno).getByRole("checkbox", { name: /Wyrażam zgodę na kontakt/ }),
    ).toBeInTheDocument();
  });

  it("„Zapytaj o termin dla firmy” otwiera wariant dla firm z tym samym szkoleniem", async () => {
    const { router, okno } = await otworzOkno(/Zapytaj o termin dla firmy/);
    expect(okno).toHaveAccessibleName("Zapytaj o termin dla firmy");
    expect(
      within(okno).getByRole("heading", { name: "Zapytaj o termin dla firmy" }),
    ).toBeInTheDocument();
    expect(within(okno).getByRole("button", { name: "Firma" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(okno).getByLabelText("Interesujące szkolenie / obszar")).toHaveValue(
      "Szkolenie zamknięte dla zespołu",
    );
    expect(await poleSzkolenia(okno)).toHaveValue("genai");
    expect(adres(router)).toBe("/szkolenia/genai");
  });

  it("lista „Szkolenie” to opublikowane szkolenia i wybór można zmienić", async () => {
    const wiersz = biezacaAtrapa().dane["szkolenia"]?.[1];
    if (!wiersz) throw new Error("test: brak drugiego szkolenia w atrapie");
    wiersz["status"] = "draft";
    const szkic = String(wiersz["id"]);
    const { user, okno } = await otworzOkno(/Zapytaj o termin dla firmy/);
    const pole = await poleSzkolenia(okno);
    const wartosci = [...pole.querySelectorAll("option")].map((o) => o.value);
    expect(wartosci).toContain("genai");
    expect(wartosci).toContain("python");
    expect(wartosci).not.toContain(szkic);
    await user.selectOptions(pole, "python");
    expect(pole).toHaveValue("python");
  });

  it("przycisk „Wyślij zgłoszenie” jest nieaktywny z komunikatem, bez sieci i bez sukcesu", async () => {
    const { user, okno } = await otworzOkno(/Zapisz się na szkolenie/);
    await poleSzkolenia(okno);
    const zapytania: string[] = [];
    vi.stubGlobal("fetch", (...args: unknown[]) => {
      zapytania.push(String(args[0]));
      throw new Error("test: okno zapisu nie ma prawa wołać sieci");
    });
    const atrapa = biezacaAtrapa();
    const wywolaniaPrzed = atrapa.wywolania.length;

    const wyslij = within(okno).getByRole("button", { name: /Wyślij zgłoszenie/ });
    expect(wyslij).toBeDisabled();
    const komunikat = within(okno).getByText(KOMUNIKAT);
    expect(wyslij).toHaveAttribute("aria-describedby", komunikat.id);

    const formularz = okno.querySelector("form") as HTMLFormElement;
    const przed = formularz.innerHTML;
    fireEvent.submit(formularz);
    await user.click(wyslij);
    expect(formularz.innerHTML).toBe(przed);
    expect(zapytania).toEqual([]);
    expect(atrapa.wywolania.length).toBe(wywolaniaPrzed);
    expect(okno.querySelector('[role="status"]')).toBeNull();
    expect(okno.querySelector('[role="alert"]')).toBeNull();
    for (const falsz of [/Dziękujemy/i, /Wysłano/i, /Skontaktujemy się/i]) {
      expect(within(okno).queryByText(falsz)).toBeNull();
    }
  });

  it("Esc zamyka okno, a fokus wraca na „Zapisz się na szkolenie”", async () => {
    const { user, przycisk } = await otworzOkno(/Zapisz się na szkolenie/);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(przycisk).toHaveFocus();
  });

  it("przycisk zamknięcia zamyka okno, a fokus wraca na „Zapytaj o termin dla firmy”", async () => {
    const { user, przycisk, okno } = await otworzOkno(/Zapytaj o termin dla firmy/);
    await user.click(within(okno).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(przycisk).toHaveFocus();
  });

  it("kliknięcie poza oknem (w tło) zamyka okno bez zmiany adresu", async () => {
    const { user, router, okno } = await otworzOkno(/Zapisz się na szkolenie/);
    const tlo = okno.previousElementSibling as HTMLElement;
    expect(tlo).toHaveAttribute("data-state", "open");
    await user.click(tlo);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(adres(router)).toBe("/szkolenia/genai");
  });

  it("błąd wczytania listy szkoleń: pole pokazuje tylko bieżące szkolenie", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/szkolenia/genai");
    await screen.findByRole("heading", { level: 1 });
    const atrapa = biezacaAtrapa();
    atrapa.sterowanie.tryby["szkolenia"] = "blad";
    const odczytyPrzed = atrapa.gdzie("szkolenia", "select").length;
    await user.click(screen.getByRole("button", { name: /Zapisz się na szkolenie/ }));
    const okno = await screen.findByRole("dialog");
    const pole = within(okno).getByLabelText("Szkolenie") as HTMLSelectElement;
    // Okno pyta o listę dopiero po otwarciu; czekamy na to zapytanie i na jego obsługę.
    await waitFor(() =>
      expect(atrapa.gdzie("szkolenia", "select").length).toBeGreaterThan(odczytyPrzed),
    );
    await new Promise((r) => setTimeout(r, 0));
    expect([...pole.querySelectorAll("option")].map((o) => o.value)).toEqual(["genai"]);
    expect(pole).toHaveValue("genai");
  });

  it("błąd odświeżenia po wczytanej liście: pole ma tylko bieżące szkolenie i je wybiera", async () => {
    const { user, router, okno } = await otworzOkno(/Zapisz się na szkolenie/);
    const pole = await poleSzkolenia(okno);
    await user.selectOptions(pole, "python");
    expect(pole).toHaveValue("python");

    const atrapa = biezacaAtrapa();
    atrapa.sterowanie.tryby["szkolenia"] = "blad";
    const odczytyPrzed = atrapa.gdzie("szkolenia", "select").length;
    await act(async () => {
      await router.options.context.queryClient.refetchQueries({
        queryKey: ["szkolenia", "okno-zapisu"],
      });
    });
    expect(atrapa.gdzie("szkolenia", "select").length).toBeGreaterThan(odczytyPrzed);
    await waitFor(() =>
      expect([...pole.querySelectorAll("option")].map((o) => o.value)).toEqual(["genai"]),
    );
    expect(pole).toHaveValue("genai");
  });

  it("dostępność okna: nazwa z tytułu, etykiety pól, opis wysyłki, pełna szerokość na telefonie", async () => {
    const { okno } = await otworzOkno(/Zapisz się na szkolenie/);
    expect(okno).toHaveAccessibleName("Zapisz się na szkolenie");
    expect(okno).toHaveAccessibleDescription("Generatywne AI dla biznesu");
    await poleSzkolenia(okno);

    // Każde pole formularza ma dostępną nazwę (widoczna etykieta albo etykieta pola wyboru).
    const pola = okno.querySelectorAll("input, select, textarea");
    expect(pola.length).toBeGreaterThan(0);
    for (const pole of pola) {
      expect(pole).toHaveAccessibleName();
    }
    for (const etykieta of [
      "Imię i nazwisko",
      "E-mail",
      "Telefon",
      "Szkolenie",
      "Interesujące szkolenie / obszar",
      "Wiadomość",
    ]) {
      expect(within(okno).getByLabelText(etykieta)).toBeInTheDocument();
    }

    const wyslij = within(okno).getByRole("button", { name: /Wyślij zgłoszenie/ });
    expect(wyslij).toHaveAccessibleDescription(KOMUNIKAT);

    // Na małym ekranie okno zajmuje cały ekran i przewija się w środku; od `sm` jest wyśrodkowane.
    for (const klasa of [
      "w-full",
      "max-h-[100dvh]",
      "overflow-y-auto",
      "rounded-none",
      "sm:max-w-xl",
      "sm:rounded-lg",
    ]) {
      expect(okno).toHaveClass(klasa);
    }
    expect(okno).not.toHaveClass("max-w-lg");
  });
});
