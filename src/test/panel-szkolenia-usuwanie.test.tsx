/**
 * Potwierdzenie usunięcia w osobnym pliku: drugi modal Radix otwarty w tym samym
 * dokumencie jsdom po wcześniejszym teście zawiesza przebieg, a izolacja pliku temu zapobiega.
 */
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StanKonfiguracji } from "@/lib/supabase/klient";
import { utworzAtrape, wierszSzkolenia, type Atrapa } from "./atrapa-supabase";
import { zamontujTrase } from "./harness-routera";

const stan = vi.hoisted(() => ({
  atrapa: null as Atrapa | null,
  konfig: { ok: true } as StanKonfiguracji,
}));

vi.mock("@/lib/supabase/klient", () => ({
  stanKonfiguracji: () => stan.konfig,
  pobierzKlienta: () => {
    if (!stan.atrapa) throw new Error("test: brak atrapy");
    return stan.atrapa.klient;
  },
}));

function atrapa(): Atrapa {
  if (!stan.atrapa) throw new Error("test: brak atrapy");
  return stan.atrapa;
}

function zalogowany(dane: Parameters<typeof utworzAtrape>[0] = {}) {
  stan.atrapa = utworzAtrape(dane);
  stan.atrapa.sterowanie.sesja = { user: { email: "redaktor@iskt.pl" }, access_token: "t" };
}

beforeEach(() => zalogowany({ szkolenia: [wierszSzkolenia()] }));
afterEach(cleanup);

/**
 * Dialog szukany selektorem, a kliknięcia w nim przez fireEvent: symulacja wskaźnika
 * user-event przy otwartym modalu Radix w pełnym drzewie aplikacji blokuje jsdom.
 */
async function znajdzDialog(): Promise<HTMLElement> {
  let dialog: HTMLElement | null = null;
  await waitFor(() => {
    dialog = document.querySelector<HTMLElement>('[role="alertdialog"]');
    expect(dialog).not.toBeNull();
  });
  return dialog as unknown as HTMLElement;
}

describe("Usuwanie szkolenia", () => {
  it("potwierdzenie usuwa tylko szkolenie", async () => {
    await zamontujTrase("/panel/szkolenia");
    fireEvent.click(await screen.findByLabelText("Usuń: Generatywne AI dla biznesu"));
    const dialog = await znajdzDialog();
    fireEvent.click(within(dialog).getByText("Usuń na stałe"));
    await waitFor(() => expect(atrapa().gdzie("szkolenia", "delete")).toHaveLength(1));
    expect(atrapa().gdzie("trenerzy", "delete")).toHaveLength(0);
    expect(await screen.findByText("Wpis został usunięty.")).toBeVisible();
  });
});
