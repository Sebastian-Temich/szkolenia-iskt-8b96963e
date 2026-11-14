import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StanKonfiguracji } from "@/lib/supabase/klient";
import { formatujKwote } from "@/lib/szkolenia/adapter";
import { utworzAtrape, wierszSzkolenia, wierszTrenera, type Atrapa } from "./atrapa-supabase";
import { zamontujTrase } from "./harness-routera";

/**
 * Issue #39: na telefonie (< 768 px) listy szkoleń i trenerów w panelu to karty z tymi samymi
 * danymi i akcjami co wiersz tabeli; od 768 px zostaje tabela. Szerokość okna ustawiamy przez
 * `window.innerWidth`, z którego korzysta `useIsMobile`.
 */

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

const GENAI = wierszSzkolenia();
const ESG = wierszSzkolenia({
  id: "esg",
  sort_order: 2,
  title: "ESG w praktyce",
  cat: "ESG",
  price: 990,
  status: "draft",
  published_at: null,
});
const ANNA = wierszTrenera({ areas: ["AI", "Dane"] });
const JAN = wierszTrenera({
  id: "jan-kowalski",
  sort_order: 2,
  name: "Jan Kowalski",
  initials: "JK",
  role: "Trener ESG",
  areas: ["ESG"],
  status: "draft",
  published_at: null,
});
const PRZYPISANIE = {
  szkolenie_id: "genai",
  trener_id: "anna-nowak",
  sort_order_trener: 0,
  sort_order_szkolenie: 0,
};

const SZEROKOSC_DOMYSLNA = window.innerWidth;

function ustawSzerokosc(px: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: px });
}

function zalogowany(dane: Parameters<typeof utworzAtrape>[0]) {
  stan.atrapa = utworzAtrape(dane);
  stan.atrapa.sterowanie.sesja = { user: { email: "redaktor@iskt.pl" }, access_token: "t" };
}

beforeEach(() =>
  zalogowany({ szkolenia: [GENAI, ESG], trenerzy: [ANNA, JAN], szkolenie_trener: [PRZYPISANIE] }),
);
afterEach(() => {
  cleanup();
  ustawSzerokosc(SZEROKOSC_DOMYSLNA);
});

/** Pary etykieta → wartość z listy opisów karty. */
function polaKarty(karta: HTMLElement): Record<string, string> {
  const wynik: Record<string, string> = {};
  for (const dt of Array.from(karta.querySelectorAll("dt"))) {
    const dd = dt.nextElementSibling;
    wynik[dt.textContent ?? ""] = dd?.textContent ?? "";
  }
  return wynik;
}

function oczekujCeluDotykowego(el: HTMLElement) {
  expect(el.className).toContain("min-h-11");
  expect(el.className).toContain("min-w-11");
}

async function kartySzkolen() {
  const lista = await screen.findByRole("list", { name: "Lista szkoleń" });
  return within(lista).getAllByRole("listitem");
}

describe("Lista szkoleń w panelu: karty na telefonie (#39)", () => {
  it("390 px: karty ul/li z tytułem w nagłówku, polami tabeli i bez tabeli", async () => {
    ustawSzerokosc(390);
    await zamontujTrase("/panel/szkolenia");
    const karty = await kartySzkolen();
    expect(karty).toHaveLength(2);
    expect(screen.queryByRole("table")).toBeNull();

    const [genai, esg] = karty as [HTMLElement, HTMLElement];
    expect(
      within(genai).getByRole("heading", { level: 2, name: "Generatywne AI dla biznesu" }),
    ).toBeVisible();
    expect(polaKarty(genai)).toEqual({
      Kolejność: "1",
      Identyfikator: "genai",
      Kategoria: "AI",
      Cena: formatujKwote(1490),
      Status: "Opublikowane",
      Trenerzy: "1",
    });
    expect(within(esg).getByRole("heading", { level: 2, name: "ESG w praktyce" })).toBeVisible();
    expect(polaKarty(esg)).toMatchObject({ Kategoria: "ESG", Status: "Szkic", Trenerzy: "0" });
    expect(screen.getByRole("status", { name: "Liczba wyników" })).toHaveTextContent("Wyniki: 2");
  });

  it("390 px: karta ma akcje wiersza z tymi samymi nazwami i celami ≥ 44×44 px", async () => {
    ustawSzerokosc(390);
    await zamontujTrase("/panel/szkolenia");
    const [genai, esg] = (await kartySzkolen()) as [HTMLElement, HTMLElement];

    const edytuj = within(genai).getByRole("link", { name: "Edytuj: Generatywne AI dla biznesu" });
    expect(edytuj).toHaveAttribute("href", "/panel/szkolenia/genai");
    const wycofaj = within(genai).getByRole("button", {
      name: "Wycofaj: Generatywne AI dla biznesu",
    });
    const usun = within(genai).getByRole("button", { name: "Usuń: Generatywne AI dla biznesu" });
    const publikuj = within(esg).getByRole("button", { name: "Publikuj: ESG w praktyce" });
    for (const el of [edytuj, wycofaj, usun, publikuj]) oczekujCeluDotykowego(el);
  });

  it("390 px: publikacja z karty ustawia status published", async () => {
    const user = userEvent.setup();
    ustawSzerokosc(390);
    await zamontujTrase("/panel/szkolenia");
    const [, esg] = (await kartySzkolen()) as [HTMLElement, HTMLElement];
    await user.click(within(esg).getByRole("button", { name: "Publikuj: ESG w praktyce" }));
    await waitFor(() => expect(atrapa().gdzie("szkolenia", "update")).toHaveLength(1));
    const w = atrapa().gdzie("szkolenia", "update")[0];
    expect((w?.wiersz as Record<string, unknown>)["status"]).toBe("published");
    expect(w?.filtry).toEqual([{ kolumna: "id", operator: "eq", wartosc: "esg" }]);
  });

  it("390 px: edycja z karty otwiera formularz szkolenia", async () => {
    const user = userEvent.setup();
    ustawSzerokosc(390);
    await zamontujTrase("/panel/szkolenia");
    const [genai] = (await kartySzkolen()) as [HTMLElement];
    await user.click(
      within(genai).getByRole("link", { name: "Edytuj: Generatywne AI dla biznesu" }),
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Edycja: Generatywne AI dla biznesu",
      }),
    ).toBeVisible();
  });

  it("768 px: tabela jak dotąd, bez listy kart", async () => {
    ustawSzerokosc(768);
    await zamontujTrase("/panel/szkolenia");
    expect(await screen.findByRole("table")).toBeVisible();
    expect(screen.getByText("ESG w praktyce").closest("tr")).not.toBeNull();
    expect(screen.queryByRole("list", { name: "Lista szkoleń" })).toBeNull();
  });

  it("767 px: ostatnia szerokość z kartami", async () => {
    ustawSzerokosc(767);
    await zamontujTrase("/panel/szkolenia");
    expect(await kartySzkolen()).toHaveLength(2);
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("Lista trenerów w panelu: karty na telefonie (#39)", () => {
  it("390 px: karty z imieniem w nagłówku, polami tabeli i akcjami ≥ 44×44 px", async () => {
    ustawSzerokosc(390);
    await zamontujTrase("/panel/trenerzy");
    const lista = await screen.findByRole("list", { name: "Lista trenerów" });
    const karty = within(lista).getAllByRole("listitem") as [HTMLElement, HTMLElement];
    expect(karty).toHaveLength(2);
    expect(screen.queryByRole("table")).toBeNull();

    const [anna, jan] = karty;
    expect(within(anna).getByRole("heading", { level: 2, name: "Anna Nowak" })).toBeVisible();
    expect(polaKarty(anna)).toEqual({
      Kolejność: "1",
      Identyfikator: "anna-nowak",
      Rola: "Trenerka AI",
      Obszary: "AI, Dane",
      Status: "Opublikowane",
      Szkolenia: "1",
    });
    expect(polaKarty(jan)).toMatchObject({ Status: "Szkic", Szkolenia: "0" });

    const edytuj = within(anna).getByRole("link", { name: "Edytuj: Anna Nowak" });
    expect(edytuj).toHaveAttribute("href", "/panel/trenerzy/anna-nowak");
    for (const el of [
      edytuj,
      within(anna).getByRole("button", { name: "Wycofaj: Anna Nowak" }),
      within(anna).getByRole("button", { name: "Usuń: Anna Nowak" }),
      within(jan).getByRole("button", { name: "Publikuj: Jan Kowalski" }),
    ]) {
      oczekujCeluDotykowego(el);
    }
  });

  it("1024 px: tabela jak dotąd, bez listy kart", async () => {
    ustawSzerokosc(1024);
    await zamontujTrase("/panel/trenerzy");
    expect(await screen.findByRole("table")).toBeVisible();
    expect(screen.getByText("Jan Kowalski").closest("tr")).not.toBeNull();
    expect(screen.queryByRole("list", { name: "Lista trenerów" })).toBeNull();
  });
});

describe("Stany list w widoku kart (#39)", () => {
  beforeEach(() => ustawSzerokosc(390));

  it("szkolenia: ładowanie pokazuje szkielet z aria-busy", async () => {
    atrapa().sterowanie.tryby["szkolenia"] = "wisi";
    await zamontujTrase("/panel/szkolenia");
    expect(await screen.findByLabelText("Wczytujemy listę szkoleń")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("szkolenia: pusta lista pokazuje zaproszenie do dodania, bez kart", async () => {
    zalogowany({ szkolenia: [] });
    await zamontujTrase("/panel/szkolenia");
    expect(
      await screen.findByRole("heading", { name: "Nie ma jeszcze żadnych szkoleń" }),
    ).toBeVisible();
    expect(screen.queryByRole("list", { name: "Lista szkoleń" })).toBeNull();
  });

  it("trenerzy: pusta lista pokazuje zaproszenie do dodania, bez kart", async () => {
    zalogowany({ trenerzy: [] });
    await zamontujTrase("/panel/trenerzy");
    expect(
      await screen.findByRole("heading", { name: "Nie ma jeszcze żadnych trenerów" }),
    ).toBeVisible();
    expect(screen.queryByRole("list", { name: "Lista trenerów" })).toBeNull();
  });

  it("szkolenia: błąd wczytania pokazuje komunikat z ponowieniem", async () => {
    atrapa().sterowanie.tryby["szkolenia"] = "blad";
    await zamontujTrase("/panel/szkolenia");
    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("heading", { name: "Nie udało się wczytać listy szkoleń" }),
    ).toBeVisible();
    expect(within(alert).getByRole("button", { name: "Spróbuj ponownie" })).toBeEnabled();
    expect(screen.queryByRole("list", { name: "Lista szkoleń" })).toBeNull();
  });

  it("trenerzy: błąd wczytania pokazuje komunikat z ponowieniem", async () => {
    atrapa().sterowanie.tryby["trenerzy"] = "blad";
    await zamontujTrase("/panel/trenerzy");
    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("heading", { name: "Nie udało się wczytać listy trenerów" }),
    ).toBeVisible();
  });

  it("szkolenia: fraza zawęża karty i licznik, a brak wyników daje „Wyniki: 0” bez kart", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia");
    expect(await kartySzkolen()).toHaveLength(2);
    const szukaj = screen.getByLabelText("Szukaj");

    await user.type(szukaj, "ESG");
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Liczba wyników" })).toHaveTextContent("Wyniki: 1"),
    );
    const lista = screen.getByRole("list", { name: "Lista szkoleń" });
    expect(within(lista).getAllByRole("listitem")).toHaveLength(1);
    expect(within(lista).getByRole("heading", { name: "ESG w praktyce" })).toBeVisible();

    await user.clear(szukaj);
    await user.type(szukaj, "nie-ma-takiego");
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Liczba wyników" })).toHaveTextContent("Wyniki: 0"),
    );
    expect(
      within(screen.getByRole("list", { name: "Lista szkoleń" })).queryAllByRole("listitem"),
    ).toHaveLength(0);
    expect(screen.queryByRole("heading", { name: "Nie ma jeszcze żadnych szkoleń" })).toBeNull();
  });

  it("trenerzy: filtr statusu zawęża zapytanie do szkiców, karty zostają", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/trenerzy");
    await screen.findByRole("list", { name: "Lista trenerów" });
    await user.selectOptions(screen.getByLabelText("Status"), "draft");
    await waitFor(() =>
      expect(
        atrapa()
          .gdzie("trenerzy", "select")
          .some((w) => w.filtry.some((f) => f.kolumna === "status" && f.wartosc === "draft")),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Liczba wyników" })).toHaveTextContent("Wyniki: 1"),
    );
    const lista = screen.getByRole("list", { name: "Lista trenerów" });
    expect(within(lista).getByRole("heading", { name: "Jan Kowalski" })).toBeVisible();
  });
});
