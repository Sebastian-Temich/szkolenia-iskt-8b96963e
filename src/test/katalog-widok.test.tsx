import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adres, zamontujTrase } from "./harness-routera";
import { atrapaMakiety } from "./atrapa-klienta";

/**
 * Źródłem danych widoków publicznych jest Supabase, więc test podstawia klienta bazy
 * atrapą wypełnioną treścią makiety. Trasy, loadery, mapery i komponenty zostają
 * produkcyjne — podmieniony jest wyłącznie transport do bazy.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());

afterEach(cleanup);

describe("Katalog szkoleń — zachowanie widoku", () => {
  it("pokazuje dziewięć kart i licznik wyników", async () => {
    await zamontujTrase("/szkolenia");
    expect(await screen.findByRole("status")).toHaveTextContent("9 szkoleń");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Znajdź szkolenie dla siebie lub zespołu",
    );
    expect(screen.getAllByRole("link", { name: /Szczegóły/ })).toHaveLength(9);
  });

  it("filtr z adresu zawęża wynik bez interakcji", async () => {
    await zamontujTrase("/szkolenia?kategoria=AI");
    expect(await screen.findByRole("status")).toHaveTextContent("2 szkolenia");
    expect(screen.getByRole("button", { name: "AI" })).toHaveAttribute("aria-pressed", "true");
  });

  it("nieznana kategoria w adresie nie wywraca widoku, lecz wraca do Wszystkie", async () => {
    await zamontujTrase("/szkolenia?kategoria=NIE-ISTNIEJE");
    expect(await screen.findByRole("status")).toHaveTextContent("9 szkoleń");
    expect(screen.getByRole("button", { name: "Wszystkie" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("fraza z adresu bez wyniku pokazuje stan pusty, a nie pustą siatkę", async () => {
    const { container } = await zamontujTrase("/szkolenia?q=zzz");
    expect(await screen.findByRole("status")).toHaveTextContent("0 szkoleń");
    expect(
      screen.getByRole("heading", { name: "Brak szkoleń dla tych kryteriów" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('a[href^="/szkolenia/"]')).toHaveLength(0);
  });

  it('„Wyczyść filtry" faktycznie zeruje oba filtry, a nie tylko znika', async () => {
    const user = userEvent.setup();
    const { router } = await zamontujTrase("/szkolenia?kategoria=AI&q=zzz");
    expect(
      await screen.findByRole("heading", { name: "Brak szkoleń dla tych kryteriów" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Wyczyść filtry" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("9 szkoleń"));
    expect(router.state.location.search).toMatchObject({ kategoria: "Wszystkie", q: "" });
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.queryByRole("heading", { name: "Brak szkoleń dla tych kryteriów" })).toBeNull();
  });

  it("klik w kategorię zmienia adres i wynik", async () => {
    const user = userEvent.setup();
    const { router } = await zamontujTrase("/szkolenia");

    await user.click(await screen.findByRole("button", { name: "ESG" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 szkolenia"));
    expect(adres(router)).toContain("kategoria=ESG");
  });

  it("karta szkolenia przenosi aktualne filtry do adresu szczegółu", async () => {
    const { container } = await zamontujTrase("/szkolenia?kategoria=Software&q=python");
    expect(await screen.findByRole("status")).toHaveTextContent("1 szkolenie");
    const karta = container.querySelector('a[href^="/szkolenia/python"]');
    expect(karta).not.toBeNull();
    expect(karta?.getAttribute("href")).toContain("kategoria=Software");
    expect(karta?.getAttribute("href")).toContain("q=python");
  });

  it("bez filtrów adres szczegółu zostaje czysty", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const karta = container.querySelector('a[href^="/szkolenia/genai"]');
    expect(karta?.getAttribute("href")).toBe("/szkolenia/genai");
  });

  it("karta pokazuje cenę po dofinansowaniu i cenę pełną z nierozdzielającą spacją", async () => {
    const { container } = await zamontujTrase("/szkolenia?q=Generatywne");
    const karta = container.querySelector('a[href^="/szkolenia/genai"]');
    expect(karta).not.toBeNull();
    // Testing Library normalizuje U+00A0 do zwykłej spacji w zapytaniach tekstowych,
    // więc obecność spacji nierozdzielającej sprawdzam na surowym textContent.
    const tekst = (karta as HTMLElement).textContent ?? "";
    expect(tekst).toContain("298 zł");
    expect(tekst).toContain("1 490 zł bez dofinansowania");
    // Poniżej zwykła spacja U+0020, w odróżnieniu od U+00A0 w asercjach powyżej.
    expect(tekst).not.toContain(" zł");
    const pozycja = tekst.indexOf("zł");
    expect(pozycja).toBeGreaterThan(0);
    expect(tekst.charCodeAt(pozycja - 1)).toBe(0x00a0);
    expect(within(karta as HTMLElement).getByText("z dofinansowaniem")).toBeInTheDocument();
  });
});
