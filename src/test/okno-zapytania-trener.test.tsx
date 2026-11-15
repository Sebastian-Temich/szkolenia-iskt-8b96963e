import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "@tanstack/react-router";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adres, zbudujRouter } from "./harness-routera";
import { atrapaMakiety, biezacaAtrapa } from "./atrapa-klienta";

/**
 * Issue #41 (F-05, „Było → ma być”): „Zapytaj o termin” na profilu trenera otwiera okno
 * zgłoszenia z #18 w zakładce „Firma”. Pole „Szkolenie” ma wybrane jedyne szkolenie trenera,
 * a przy żadnym albo kilku szkoleniach jest puste; „Wiadomość” ma wstępny tekst z trenerem.
 * Montowanie na `document`, jak w okno-zapisu.test.tsx (fokus między portalem a stroną).
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

let korzen: Root | null = null;

beforeEach(() => atrapaMakiety());

afterEach(() => {
  act(() => korzen?.unmount());
  korzen = null;
});

async function otworzOkno(sciezka: string) {
  const user = userEvent.setup();
  const router = zbudujRouter(sciezka);
  await router.load();
  korzen = createRoot(document);
  await act(async () => korzen?.render(<RouterProvider router={router} />));
  await screen.findByRole("heading", { level: 1 });
  // Było: link do /#kontakt. Ma być: przycisk otwierający okno, bez linku o tej nazwie.
  expect(screen.queryByRole("link", { name: /Zapytaj o termin/ })).toBeNull();
  const przycisk = screen.getByRole("button", { name: /Zapytaj o termin/ });
  await user.click(przycisk);
  const okno = await screen.findByRole("dialog");
  return { user, router, przycisk, okno };
}

/** Pole „Szkolenie” po wczytaniu listy opublikowanych szkoleń. */
async function poleSzkolenia(okno: HTMLElement) {
  const pole = within(okno).getByLabelText("Szkolenie") as HTMLSelectElement;
  await waitFor(() => expect(pole.querySelectorAll("option").length).toBeGreaterThan(2));
  return pole;
}

function zakladkaFirma(okno: HTMLElement) {
  return within(okno).getByRole("button", { name: "Firma" });
}

describe("Okno zapytania na profilu trenera (#41)", () => {
  it("trener z jednym szkoleniem: zakładka Firma, wybrane szkolenie, wiadomość z trenerem", async () => {
    const { router, okno } = await otworzOkno("/trenerzy/zielinska");
    expect(okno).toHaveAccessibleName("Zapytaj o termin dla firmy");
    expect(zakladkaFirma(okno)).toHaveAttribute("aria-pressed", "true");
    const pole = await poleSzkolenia(okno);
    expect(pole).toHaveValue("grants");
    expect(pole.selectedOptions[0]).toHaveTextContent("Pozyskiwanie grantów B+R");
    expect(within(okno).getByLabelText("Wiadomość")).toHaveValue(
      "Pytanie o szkolenie z trenerem: dr Magdalena Zielińska",
    );
    expect(adres(router)).toBe("/trenerzy/zielinska");
  });

  it("trener z kilkoma szkoleniami: pole Szkolenie puste do wyboru, wiadomość z trenerem", async () => {
    const { user, okno } = await otworzOkno("/trenerzy/nowak");
    expect(zakladkaFirma(okno)).toHaveAttribute("aria-pressed", "true");
    const pole = await poleSzkolenia(okno);
    expect(pole).toHaveValue("");
    expect(pole.selectedOptions[0]).toHaveTextContent("Wybierz…");
    expect(within(okno).getByLabelText("Wiadomość")).toHaveValue(
      "Pytanie o szkolenie z trenerem: dr Anna Nowak",
    );
    await user.selectOptions(pole, "genai");
    expect(pole).toHaveValue("genai");
  });

  it("trener bez szkoleń: pole Szkolenie puste, wiadomość z trenerem", async () => {
    const przypisania = biezacaAtrapa().dane["szkolenie_trener"] ?? [];
    for (let i = przypisania.length - 1; i >= 0; i--) {
      if (przypisania[i]?.["trener_id"] === "krol") przypisania.splice(i, 1);
    }
    const { okno } = await otworzOkno("/trenerzy/krol");
    const pole = await poleSzkolenia(okno);
    expect(pole).toHaveValue("");
    expect(within(okno).getByLabelText("Wiadomość")).toHaveValue(
      "Pytanie o szkolenie z trenerem: mgr Jakub Król",
    );
  });

  it("wiadomość można edytować", async () => {
    const { user, okno } = await otworzOkno("/trenerzy/zielinska");
    const wiadomosc = within(okno).getByLabelText("Wiadomość");
    await user.type(wiadomosc, " w maju");
    expect(wiadomosc).toHaveValue("Pytanie o szkolenie z trenerem: dr Magdalena Zielińska w maju");
  });

  it("Esc zamyka okno, a fokus wraca na „Zapytaj o termin”", async () => {
    const { user, przycisk } = await otworzOkno("/trenerzy/nowak");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(przycisk).toHaveFocus();
  });

  it("przycisk „Zamknij” zamyka okno, a fokus wraca na „Zapytaj o termin”", async () => {
    const { user, przycisk, okno } = await otworzOkno("/trenerzy/zielinska");
    await user.click(within(okno).getByRole("button", { name: "Zamknij" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(przycisk).toHaveFocus();
  });

  it("wysyłka zostaje zablokowana jak w oknie z #18", async () => {
    const { okno } = await otworzOkno("/trenerzy/zielinska");
    expect(within(okno).getByRole("button", { name: /Wyślij zgłoszenie/ })).toBeDisabled();
    expect(
      within(okno).getByText("Formularz zostanie podłączony w kolejnym etapie."),
    ).toBeInTheDocument();
  });
});
