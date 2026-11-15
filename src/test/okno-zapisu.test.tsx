import { act, screen, waitFor, within } from "@testing-library/react";
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
// #46: funkcja serwerowa wysyłki to granica sieci; w teście atrapa z wynikiem „ok”.
const wyslij = vi.hoisted(() => vi.fn());
vi.mock("@/lib/zgloszenia/wyslij", () => ({ wyslijZgloszenie: wyslij }));

let korzen: Root | null = null;

beforeEach(() => {
  atrapaMakiety();
  wyslij.mockReset();
  wyslij.mockResolvedValue({ wynik: "ok" });
});

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

type Uzytkownik = ReturnType<typeof userEvent.setup>;

/** Wypełnia pola osobowe okna; szkolenie i obszar zostają z ustawień okna. */
async function wypelnijOkno(user: Uzytkownik, okno: HTMLElement) {
  await user.type(within(okno).getByLabelText("Imię i nazwisko"), "Janina Testowa");
  await user.type(within(okno).getByLabelText("E-mail"), "janina@example.com");
  await user.type(within(okno).getByLabelText("Telefon"), "600 111 222");
  await user.type(within(okno).getByLabelText("Wiadomość"), "Proszę o najbliższy termin.");
  await user.click(within(okno).getByRole("checkbox", { name: /Wyrażam zgodę/ }));
}

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

  it("#46 „Zapisz się”: wysyła źródło zapis z wybranym szkoleniem, bez zapisu do bazy, potem „Dziękujemy!”", async () => {
    const { user, okno } = await otworzOkno(/Zapisz się na szkolenie/);
    await poleSzkolenia(okno);
    await user.selectOptions(
      within(okno).getByLabelText("Interesujące szkolenie / obszar"),
      "AI i narzędzia generatywne",
    );
    await wypelnijOkno(user, okno);
    const atrapa = biezacaAtrapa();
    const wywolaniaPrzed = atrapa.wywolania.length;
    await user.click(within(okno).getByRole("button", { name: "Wyślij zgłoszenie" }));
    expect(await within(okno).findByRole("heading", { name: "Dziękujemy!" })).toBeInTheDocument();
    expect(wyslij).toHaveBeenCalledTimes(1);
    expect(wyslij.mock.calls[0]?.[0].data).toMatchObject({
      zrodlo: "zapis",
      odbiorca: "individual",
      szkolenie: "genai",
      szkolenieTytul: "Generatywne AI dla biznesu",
      obszar: "AI i narzędzia generatywne",
    });
    // R6: wysyłka nie dotyka bazy (żadnego nowego wywołania klienta Supabase).
    expect(atrapa.wywolania.length).toBe(wywolaniaPrzed);
  });

  it("#46 „Zapytaj o termin dla firmy”: źródło firma także po przełączeniu na osobę indywidualną", async () => {
    const { user, okno } = await otworzOkno(/Zapytaj o termin dla firmy/);
    await poleSzkolenia(okno);
    await user.click(within(okno).getByRole("button", { name: "Osoba indywidualna" }));
    await user.selectOptions(
      within(okno).getByLabelText("Interesujące szkolenie / obszar"),
      "Projekty B+R",
    );
    await wypelnijOkno(user, okno);
    await user.click(within(okno).getByRole("button", { name: "Wyślij zgłoszenie" }));
    await within(okno).findByRole("heading", { name: "Dziękujemy!" });
    expect(wyslij.mock.calls[0]?.[0].data).toMatchObject({
      zrodlo: "firma",
      odbiorca: "individual",
      szkolenie: "genai",
    });
  });

  it("#46 po sukcesie „Zamknij” zamyka okno, a ponowne otwarcie pokazuje pusty formularz", async () => {
    const { user, przycisk, okno } = await otworzOkno(/Zapytaj o termin dla firmy/);
    await poleSzkolenia(okno);
    await wypelnijOkno(user, okno);
    await user.click(within(okno).getByRole("button", { name: "Wyślij zgłoszenie" }));
    await within(okno).findByRole("heading", { name: "Dziękujemy!" });
    const zamknij = within(okno)
      .getAllByRole("button", { name: "Zamknij" })
      .find((b) => b.textContent === "Zamknij");
    if (!zamknij) throw new Error("test: brak widocznego przycisku Zamknij");
    await user.click(zamknij);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.click(przycisk);
    const ponownie = await screen.findByRole("dialog");
    expect(within(ponownie).getByLabelText("Imię i nazwisko")).toHaveValue("");
    expect(within(ponownie).getByRole("button", { name: "Wyślij zgłoszenie" })).toBeEnabled();
  });

  it("#46 pusty formularz w oknie: fokus na imieniu, bez wywołania", async () => {
    const { user, okno } = await otworzOkno(/Zapisz się na szkolenie/);
    await poleSzkolenia(okno);
    await user.click(within(okno).getByRole("button", { name: "Wyślij zgłoszenie" }));
    expect(within(okno).getByLabelText("Imię i nazwisko")).toHaveFocus();
    expect(wyslij).not.toHaveBeenCalled();
  });

  it("Esc zamyka okno, a fokus wraca na „Zapisz się na szkolenie”", async () => {
    const { user, przycisk } = await otworzOkno(/Zapisz się na szkolenie/);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(przycisk).toHaveFocus();
  });

  it("przycisk „Zamknij” zamyka okno, a fokus wraca na „Zapytaj o termin dla firmy”", async () => {
    const { user, przycisk, okno } = await otworzOkno(/Zapytaj o termin dla firmy/);
    // Etykieta po polsku: issue #33 (backlog T-18).
    await user.click(within(okno).getByRole("button", { name: "Zamknij" }));
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

  it("po błędzie i ponownym wczytaniu listy pole wraca do wyboru gościa (#41, review PR #19)", async () => {
    const { user, router, okno } = await otworzOkno(/Zapisz się na szkolenie/);
    const pole = await poleSzkolenia(okno);
    await user.selectOptions(pole, "python");

    const atrapa = biezacaAtrapa();
    const odswiez = () =>
      act(async () => {
        await router.options.context.queryClient.refetchQueries({
          queryKey: ["szkolenia", "okno-zapisu"],
        });
      });
    atrapa.sterowanie.tryby["szkolenia"] = "blad";
    await odswiez();
    await waitFor(() => expect(pole).toHaveValue("genai"));

    atrapa.sterowanie.tryby["szkolenia"] = "ok";
    await odswiez();
    await waitFor(() => expect(pole.querySelectorAll("option").length).toBeGreaterThan(1));
    expect(pole).toHaveValue("python");
  });

  it("dostępność okna: nazwa z tytułu, etykiety pól, aktywna wysyłka, pełna szerokość na telefonie", async () => {
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

    expect(within(okno).getByRole("button", { name: "Wyślij zgłoszenie" })).toBeEnabled();

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
