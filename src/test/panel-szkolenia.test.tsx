import { cleanup, screen, waitFor, within } from "@testing-library/react";
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

function zalogowany(dane: Parameters<typeof utworzAtrape>[0] = {}) {
  stan.atrapa = utworzAtrape(dane);
  stan.atrapa.sterowanie.sesja = { user: { email: "redaktor@iskt.pl" }, access_token: "t" };
}

beforeEach(() => zalogowany({ szkolenia: [wierszSzkolenia()] }));
afterEach(cleanup);

describe("Lista szkoleń — cztery stany", () => {
  it("ładowanie: szkielet z aria-busy", async () => {
    atrapa().sterowanie.tryby["szkolenia"] = "wisi";
    await zamontujTrase("/panel/szkolenia");
    expect(await screen.findByLabelText("Wczytujemy listę szkoleń")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("pustka: komunikat i przycisk dodania", async () => {
    zalogowany({ szkolenia: [] });
    await zamontujTrase("/panel/szkolenia");
    expect(
      await screen.findByRole("heading", { name: "Nie ma jeszcze żadnych szkoleń" }),
    ).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Dodaj szkolenie" }).length).toBeGreaterThan(0);
  });

  it("błąd: komunikat bez treści wyjątku, a ponowienie faktycznie pyta bazę jeszcze raz", async () => {
    const user = userEvent.setup();
    atrapa().sterowanie.tryby["szkolenia"] = "blad";
    const { container } = await zamontujTrase("/panel/szkolenia");
    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("heading", { name: "Nie udało się wczytać listy szkoleń" }),
    ).toBeVisible();
    expect(container.textContent).not.toContain("connection reset");
    const przed = atrapa().gdzie("szkolenia", "select").length;

    atrapa().sterowanie.tryby["szkolenia"] = "ok";
    await user.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
    await waitFor(() =>
      expect(atrapa().gdzie("szkolenia", "select").length).toBeGreaterThan(przed),
    );
    expect(await screen.findByText("Generatywne AI dla biznesu")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Nie udało się wczytać listy szkoleń" }),
    ).toBeNull();
  });

  it("dane: tabela z kolumnami, plakietką szkicu i liczbą trenerów", async () => {
    zalogowany({
      szkolenia: [
        wierszSzkolenia(),
        wierszSzkolenia({
          id: "esg",
          sort_order: 2,
          title: "ESG w praktyce",
          status: "draft",
          published_at: null,
        }),
      ],
      szkolenie_trener: [{ szkolenie_id: "genai", trener_id: "anna-nowak", sort_order: 0 }],
    });
    await zamontujTrase("/panel/szkolenia");
    const wiersz = (await screen.findByText("ESG w praktyce")).closest("tr");
    expect(wiersz).not.toBeNull();
    expect(within(wiersz as HTMLElement).getByText("Szkic")).toBeVisible();
    const genai = screen.getByText("Generatywne AI dla biznesu").closest("tr") as HTMLElement;
    expect(within(genai).getByText("Opublikowane")).toBeVisible();
    expect(screen.getByText("Wyniki: 2")).toBeVisible();
  });

  it("filtr statusu zawęża zapytanie do szkiców", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia");
    await screen.findByText("Generatywne AI dla biznesu");
    await user.selectOptions(screen.getByLabelText("Status"), "draft");
    await waitFor(() =>
      expect(
        atrapa()
          .gdzie("szkolenia", "select")
          .some((w) => w.filtry.some((f) => f.kolumna === "status" && f.wartosc === "draft")),
      ).toBe(true),
    );
  });
});

async function wypelnijPoprawnie(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Identyfikator"), "nowe-szkolenie");
  await user.type(screen.getByLabelText("Tytuł"), "Nowe szkolenie");
  await user.type(screen.getByLabelText("Poziom"), "Średni");
  await user.type(screen.getByLabelText("Czas trwania"), "8 h");
  await user.type(screen.getByLabelText("Format"), "Online");
  const cena = screen.getByLabelText("Cena (PLN brutto, pełna)");
  await user.clear(cena);
  await user.type(cena, "990");
  await user.type(screen.getByLabelText("Opis"), "Opis nowego szkolenia");
  await user.type(screen.getByLabelText("Dla kogo jest to szkolenie"), "Dla każdego");
  for (const i of [1, 2, 3, 4]) await user.type(screen.getByLabelText(`Efekt ${i}`), `Efekt ${i}`);
  await user.type(screen.getByLabelText("Moduł 01"), "Wprowadzenie");
}

describe("Formularz szkolenia", () => {
  it("odrzuca zły identyfikator, niepełne efekty i ujemną cenę bez zapisu", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia/nowe");
    await wypelnijPoprawnie(user);
    const id = screen.getByLabelText("Identyfikator");
    await user.clear(id);
    await user.type(id, "Zły ID");
    await user.clear(screen.getByLabelText("Efekt 4"));
    const cena = screen.getByLabelText("Cena (PLN brutto, pełna)");
    await user.clear(cena);
    await user.type(cena, "-5");
    await user.click(screen.getByRole("button", { name: "Zapisz szkolenie" }));

    expect(await screen.findByText(/Identyfikator może zawierać tylko małe litery/)).toBeVisible();
    expect(screen.getByText("Uzupełnij tę pozycję.")).toBeVisible();
    expect(screen.getByText("Cena nie może być ujemna.")).toBeVisible();
    expect(screen.getByLabelText("Identyfikator")).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByLabelText("Cena (PLN brutto, pełna)").getAttribute("aria-describedby"),
    ).toContain("sz-cena-blad");
    expect(atrapa().gdzie("szkolenia", "insert")).toHaveLength(0);
  });

  it("zapis wysyła wiersz z kolumnami opis i for_whom, terms: null i statusem szkicu", async () => {
    const user = userEvent.setup();
    zalogowany({ szkolenia: [], trenerzy: [wierszTrenera()] });
    await zamontujTrase("/panel/szkolenia/nowe");
    await wypelnijPoprawnie(user);
    await user.click(screen.getByRole("button", { name: "Zapisz szkolenie" }));

    await waitFor(() => expect(atrapa().gdzie("szkolenia", "insert")).toHaveLength(1));
    const wiersz = atrapa().gdzie("szkolenia", "insert")[0]?.wiersz as Record<string, unknown>;
    expect(wiersz["opis"]).toBe("Opis nowego szkolenia");
    expect(wiersz["for_whom"]).toBe("Dla każdego");
    expect("desc" in wiersz).toBe(false);
    expect("forWhom" in wiersz).toBe(false);
    expect(wiersz["terms"]).toBeNull();
    expect(wiersz["price"]).toBe(990);
    expect(wiersz["status"]).toBe("draft");
    expect(wiersz["learn"]).toEqual(["Efekt 1", "Efekt 2", "Efekt 3", "Efekt 4"]);
    expect(wiersz["program"]).toEqual([{ n: "01", t: "Wprowadzenie" }]);
    expect(await screen.findByText("Szkolenie „Nowe szkolenie” zostało zapisane.")).toBeVisible();
    expect(await screen.findByRole("heading", { level: 1, name: "Szkolenia" })).toBeVisible();
  });

  it("tryb „brak terminów” zapisuje pustą listę, a nie null", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia/nowe");
    await wypelnijPoprawnie(user);
    await user.click(screen.getByLabelText("Brak terminów"));
    await user.click(screen.getByRole("button", { name: "Zapisz szkolenie" }));
    await waitFor(() => expect(atrapa().gdzie("szkolenia", "insert")).toHaveLength(1));
    const wiersz = atrapa().gdzie("szkolenia", "insert")[0]?.wiersz as Record<string, unknown>;
    expect(wiersz["terms"]).toEqual([]);
  });

  it("edycja pokazuje identyfikator tylko do odczytu", async () => {
    await zamontujTrase("/panel/szkolenia/genai");
    const id = await screen.findByLabelText("Identyfikator");
    expect(id).toHaveAttribute("readonly");
    expect(screen.getByText(/zepsułaby publiczne linki/)).toBeVisible();
  });

  it("odmowa RLS przy zapisie daje komunikat o braku uprawnień", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia/genai");
    await screen.findByLabelText("Identyfikator");
    atrapa().sterowanie.tryby["szkolenia"] = "odmowa";
    await user.click(screen.getByRole("button", { name: "Zapisz szkolenie" }));
    expect(await screen.findByText("Nie masz uprawnień do tej operacji")).toBeVisible();
  });
});

describe("Publikacja, wycofanie i usuwanie", () => {
  it("publikacja ustawia status published i niepusty published_at", async () => {
    const user = userEvent.setup();
    zalogowany({ szkolenia: [wierszSzkolenia({ status: "draft", published_at: null })] });
    await zamontujTrase("/panel/szkolenia");
    await user.click(
      await screen.findByRole("button", { name: "Publikuj: Generatywne AI dla biznesu" }),
    );
    await waitFor(() => expect(atrapa().gdzie("szkolenia", "update")).toHaveLength(1));
    const w = atrapa().gdzie("szkolenia", "update")[0];
    const wiersz = w?.wiersz as Record<string, unknown>;
    expect(wiersz["status"]).toBe("published");
    expect(typeof wiersz["published_at"]).toBe("string");
    expect(String(wiersz["published_at"]).length).toBeGreaterThan(0);
    expect(w?.filtry).toEqual([{ kolumna: "id", operator: "eq", wartosc: "genai" }]);
    expect(await screen.findByText("„Generatywne AI dla biznesu” opublikowane.")).toBeVisible();
  });

  it("wycofanie ustawia status draft", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia");
    await user.click(
      await screen.findByRole("button", { name: "Wycofaj: Generatywne AI dla biznesu" }),
    );
    await waitFor(() => expect(atrapa().gdzie("szkolenia", "update")).toHaveLength(1));
    expect(atrapa().gdzie("szkolenia", "update")[0]?.wiersz).toEqual({ status: "draft" });
    expect(
      await screen.findByText("„Generatywne AI dla biznesu” wycofane do szkicu."),
    ).toBeVisible();
  });

  it("dialog usunięcia nazywa liczbę przypisań, a anulowanie nie wysyła usunięcia", async () => {
    const user = userEvent.setup();
    zalogowany({
      szkolenia: [wierszSzkolenia()],
      szkolenie_trener: [
        { szkolenie_id: "genai", trener_id: "anna-nowak", sort_order: 0 },
        { szkolenie_id: "genai", trener_id: "jan-kowalski", sort_order: 1 },
      ],
    });
    await zamontujTrase("/panel/szkolenia");
    await user.click(
      await screen.findByRole("button", { name: "Usuń: Generatywne AI dla biznesu" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(
      "Usuniesz szkolenie Generatywne AI dla biznesu. Zniknie 2 przypisań do trenerów. Sami trenerzy zostaną nietknięci.",
    );
    expect(dialog).toHaveTextContent("Zalecaną drogą wycofania jest „Wycofaj”");
    await user.click(within(dialog).getByRole("button", { name: "Anuluj" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(atrapa().wywolania.filter((w) => w.operacja === "delete")).toHaveLength(0);
  });

  it("potwierdzenie usuwa tylko szkolenie", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia");
    await user.click(
      await screen.findByRole("button", { name: "Usuń: Generatywne AI dla biznesu" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Usuń na stałe" }));
    await waitFor(() => expect(atrapa().gdzie("szkolenia", "delete")).toHaveLength(1));
    expect(atrapa().gdzie("trenerzy", "delete")).toHaveLength(0);
    expect(await screen.findByText("Nie ma jeszcze żadnych szkoleń")).toBeVisible();
  });
});
