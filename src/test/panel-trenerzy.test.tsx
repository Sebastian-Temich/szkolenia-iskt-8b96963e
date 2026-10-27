import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StanKonfiguracji } from "@/lib/supabase/klient";
import { utworzAtrape, wierszSzkolenia, wierszTrenera, type Atrapa } from "./atrapa-supabase";
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

const ANNA = wierszTrenera();
const JAN = wierszTrenera({
  id: "jan-kowalski",
  sort_order: 2,
  name: "Jan Kowalski",
  initials: "JK",
});
const GENAI = wierszSzkolenia();
const ESG = wierszSzkolenia({ id: "esg", sort_order: 2, title: "ESG w praktyce", cat: "ESG" });

function zalogowany(dane: Parameters<typeof utworzAtrape>[0]) {
  stan.atrapa = utworzAtrape(dane);
  stan.atrapa.sterowanie.sesja = { user: { email: "redaktor@iskt.pl" }, access_token: "t" };
}

beforeEach(() => zalogowany({ trenerzy: [ANNA, JAN], szkolenia: [GENAI, ESG] }));
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

async function wypelnijTrenera(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Identyfikator"), "ewa-zielinska");
  await user.type(screen.getByLabelText("Imię i nazwisko"), "Ewa Zielińska");
  await user.type(screen.getByLabelText("Inicjały"), "EZ");
  await user.type(screen.getByLabelText("Rola"), "Trenerka ESG");
  await user.click(screen.getByLabelText("ESG"));
  await user.type(screen.getByLabelText("Hasło przewodnie"), "Zrównoważony rozwój w praktyce.");
  await user.type(screen.getByLabelText("Biogram"), "Biogram trenerki.");
}

describe("Lista trenerów", () => {
  it("pokazuje trenerów z liczbą szkoleń", async () => {
    zalogowany({
      trenerzy: [ANNA],
      szkolenie_trener: [
        { szkolenie_id: "genai", trener_id: "anna-nowak", sort_order: 0 },
        { szkolenie_id: "esg", trener_id: "anna-nowak", sort_order: 0 },
      ],
    });
    await zamontujTrase("/panel/trenerzy");
    const wiersz = (await screen.findByText("Anna Nowak")).closest("tr") as HTMLElement;
    expect(within(wiersz).getByText("Trenerka AI")).toBeVisible();
    await waitFor(() => expect(within(wiersz).getByText("2")).toBeVisible());
  });

  it("błąd listy ma własny nagłówek i ponowienie", async () => {
    const user = userEvent.setup();
    atrapa().sterowanie.tryby["trenerzy"] = "blad";
    await zamontujTrase("/panel/trenerzy");
    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("heading", { name: "Nie udało się wczytać listy trenerów" }),
    ).toBeVisible();
    const przed = atrapa().gdzie("trenerzy", "select").length;
    atrapa().sterowanie.tryby["trenerzy"] = "ok";
    await user.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
    await waitFor(() => expect(atrapa().gdzie("trenerzy", "select").length).toBeGreaterThan(przed));
    expect(await screen.findByText("Anna Nowak")).toBeVisible();
  });
});

describe("Formularz trenera", () => {
  it("puste zdjęcie zapisuje photo_url: null i w dokumencie nie ma pola pliku", async () => {
    const user = userEvent.setup();
    const { container } = await zamontujTrase("/panel/trenerzy/nowy");
    await wypelnijTrenera(user);
    expect(container.querySelector('input[type="file"]')).toBeNull();
    await user.click(screen.getByRole("button", { name: "Zapisz trenera" }));
    await waitFor(() => expect(atrapa().gdzie("trenerzy", "insert")).toHaveLength(1));
    const wiersz = atrapa().gdzie("trenerzy", "insert")[0]?.wiersz as Record<string, unknown>;
    expect(wiersz["photo_url"]).toBeNull();
    expect(wiersz["areas"]).toEqual(["ESG"]);
    expect(wiersz["experience"]).toEqual([]);
    expect(wiersz["status"]).toBe("draft");
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("niepoprawny adres zdjęcia i brak obszaru blokują zapis", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/trenerzy/nowy");
    await wypelnijTrenera(user);
    await user.click(screen.getByLabelText("ESG"));
    await user.type(screen.getByLabelText("Adres zdjęcia (opcjonalnie)"), "ftp://zdjecie");
    await user.click(screen.getByRole("button", { name: "Zapisz trenera" }));
    expect(await screen.findByText(/zaczynający się od http:\/\/ lub https:\/\//)).toBeVisible();
    expect(screen.getByText("Zaznacz co najmniej jeden obszar.")).toBeVisible();
    expect(atrapa().gdzie("trenerzy", "insert")).toHaveLength(0);
  });

  it("poprawny adres zdjęcia trafia do photo_url", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/trenerzy/nowy");
    await wypelnijTrenera(user);
    await user.type(
      screen.getByLabelText("Adres zdjęcia (opcjonalnie)"),
      "https://example.org/ewa.jpg",
    );
    await user.click(screen.getByRole("button", { name: "Zapisz trenera" }));
    await waitFor(() => expect(atrapa().gdzie("trenerzy", "insert")).toHaveLength(1));
    const wiersz = atrapa().gdzie("trenerzy", "insert")[0]?.wiersz as Record<string, unknown>;
    expect(wiersz["photo_url"]).toBe("https://example.org/ewa.jpg");
  });
});

describe("Przypisania", () => {
  it("przypisuje wielu trenerów do szkolenia w wybranej kolejności", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia/genai");
    const wybor = await screen.findByLabelText("Dodaj: trenerzy");
    await user.selectOptions(wybor, "jan-kowalski");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
    await user.selectOptions(screen.getByLabelText("Dodaj: trenerzy"), "anna-nowak");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
    await user.click(screen.getByRole("button", { name: "Zapisz szkolenie" }));

    await waitFor(() => expect(atrapa().gdzie("szkolenie_trener", "insert")).toHaveLength(1));
    expect(atrapa().gdzie("szkolenie_trener", "insert")[0]?.wiersz).toEqual([
      { szkolenie_id: "genai", trener_id: "jan-kowalski", sort_order: 0 },
      { szkolenie_id: "genai", trener_id: "anna-nowak", sort_order: 1 },
    ]);
    expect(atrapa().gdzie("szkolenie_trener", "delete")).toHaveLength(0);
    expect(atrapa().gdzie("szkolenia", "update")).toHaveLength(1);
  });

  it("przypisuje wiele szkoleń do trenera", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/trenerzy/anna-nowak");
    await user.selectOptions(await screen.findByLabelText("Dodaj: szkolenia"), "genai");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
    await user.selectOptions(screen.getByLabelText("Dodaj: szkolenia"), "esg");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
    await user.click(screen.getByRole("button", { name: "Zapisz trenera" }));

    await waitFor(() => expect(atrapa().gdzie("szkolenie_trener", "insert")).toHaveLength(1));
    expect(atrapa().gdzie("szkolenie_trener", "insert")[0]?.wiersz).toEqual([
      { trener_id: "anna-nowak", szkolenie_id: "genai", sort_order: 0 },
      { trener_id: "anna-nowak", szkolenie_id: "esg", sort_order: 1 },
    ]);
  });

  it("zapis wyznacza różnicę: usuwa tylko zdjęte, dodaje tylko brakujące", async () => {
    const user = userEvent.setup();
    zalogowany({
      trenerzy: [ANNA, JAN],
      szkolenia: [GENAI],
      szkolenie_trener: [{ szkolenie_id: "genai", trener_id: "anna-nowak", sort_order: 0 }],
    });
    await zamontujTrase("/panel/szkolenia/genai");
    await user.click(await screen.findByRole("button", { name: "Usuń przypisanie: Anna Nowak" }));
    await user.selectOptions(screen.getByLabelText("Dodaj: trenerzy"), "jan-kowalski");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
    await user.click(screen.getByRole("button", { name: "Zapisz szkolenie" }));

    await waitFor(() => expect(atrapa().gdzie("szkolenie_trener", "insert")).toHaveLength(1));
    const usuniecia = atrapa().gdzie("szkolenie_trener", "delete");
    expect(usuniecia).toHaveLength(1);
    expect(usuniecia[0]?.filtry).toEqual([
      { kolumna: "szkolenie_id", operator: "eq", wartosc: "genai" },
      { kolumna: "trener_id", operator: "in", wartosc: ["anna-nowak"] },
    ]);
    expect(atrapa().gdzie("szkolenie_trener", "insert")[0]?.wiersz).toEqual([
      { szkolenie_id: "genai", trener_id: "jan-kowalski", sort_order: 0 },
    ]);
  });
});

describe("Usuwanie trenera", () => {
  it("dialog nazywa skutek, a potwierdzenie usuwa tylko z tabeli trenerzy", async () => {
    zalogowany({
      trenerzy: [ANNA],
      szkolenia: [GENAI],
      szkolenie_trener: [{ szkolenie_id: "genai", trener_id: "anna-nowak", sort_order: 0 }],
    });
    await zamontujTrase("/panel/trenerzy");
    fireEvent.click(await screen.findByLabelText("Usuń: Anna Nowak"));
    const dialog = await znajdzDialog();
    expect(dialog).toHaveTextContent(
      "Usuniesz trenera Anna Nowak. Zniknie 1 przypisań do szkoleń. Same szkolenia zostaną nietknięte.",
    );
    fireEvent.click(within(dialog).getByText("Usuń na stałe"));
    await waitFor(() => expect(atrapa().gdzie("trenerzy", "delete")).toHaveLength(1));
    expect(atrapa().gdzie("trenerzy", "delete")[0]?.filtry).toEqual([
      { kolumna: "id", operator: "eq", wartosc: "anna-nowak" },
    ]);
    expect(atrapa().gdzie("szkolenia", "delete")).toHaveLength(0);
    expect(atrapa().wywolania.filter((w) => w.operacja === "delete")).toHaveLength(1);
  });
});
