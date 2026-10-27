import { cleanup, screen, within } from "@testing-library/react";
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

describe("Szczegół szkolenia — zachowanie widoku", () => {
  it("pokazuje tytuł, program, cenę i terminy właściciela", async () => {
    await zamontujTrase("/szkolenia/genai");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Generatywne AI dla biznesu",
    );
    expect(screen.getByRole("heading", { name: "Program szkolenia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Czego się nauczysz" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dla kogo jest to szkolenie" })).toBeInTheDocument();
    expect(screen.getByText("12–13 wrz 2026 · Online")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Najbliższe terminy" })).toBeInTheDocument();
  });

  it("cena na szczególe ma spację nierozdzielającą przed symbolem waluty", async () => {
    const { container } = await zamontujTrase("/szkolenia/python");
    const tekst = container.textContent ?? "";
    expect(tekst).toContain("338 zł");
    expect(tekst).toContain("1 690 zł bez dofinansowania");
    // Poniżej zwykła spacja U+0020, w odróżnieniu od U+00A0 w asercjach powyżej.
    expect(tekst).not.toContain(" zł");
    const pozycja = tekst.indexOf("zł");
    expect(pozycja).toBeGreaterThan(0);
    expect(tekst.charCodeAt(pozycja - 1)).toBe(0x00a0);
  });

  // R5: powrót do katalogu zachowuje filtry przeniesione adresem.
  it("odnośnik Katalog przenosi filtry z adresu szczegółu", async () => {
    const { container } = await zamontujTrase("/szkolenia/python?kategoria=Software&q=python");
    const powrot = within(
      container.querySelector("nav[aria-label='Ścieżka nawigacji']") as HTMLElement,
    ).getByRole("link", { name: /Katalog/ });
    expect(powrot.getAttribute("href")).toContain("kategoria=Software");
    expect(powrot.getAttribute("href")).toContain("q=python");
  });

  it("bez filtrów odnośnik Katalog prowadzi na czysty adres katalogu", async () => {
    const { container } = await zamontujTrase("/szkolenia/python");
    const powrot = within(
      container.querySelector("nav[aria-label='Ścieżka nawigacji']") as HTMLElement,
    ).getByRole("link", { name: /Katalog/ });
    expect(powrot.getAttribute("href")).toBe("/szkolenia");
  });

  it("przejście z katalogu na szczegół i powrót zachowuje zawężony wynik", async () => {
    const user = userEvent.setup();
    const { router, container } = await zamontujTrase("/szkolenia?kategoria=Software&q=python");
    expect(await screen.findByRole("status")).toHaveTextContent("1 szkolenie");

    await user.click(container.querySelector('a[href^="/szkolenia/python"]') as HTMLElement);
    await screen.findByRole("heading", { name: "Program szkolenia" });

    const powrot = within(
      container.querySelector("nav[aria-label='Ścieżka nawigacji']") as HTMLElement,
    ).getByRole("link", { name: /Katalog/ });
    await user.click(powrot);

    await screen.findByRole("status");
    expect(screen.getByRole("status")).toHaveTextContent("1 szkolenie");
    expect(adres(router)).toContain("kategoria=Software");
    expect(adres(router)).toContain("q=python");
  });

  // R3: prawa kolumna drugiej sekcji nie jest już porzucona.
  it("druga sekcja ma ciemną kartę dofinansowania z makiety i działającym CTA", async () => {
    await zamontujTrase("/szkolenia/genai");
    const karta = await screen.findByRole("complementary", { name: "Dofinansowanie" });
    // Ciemne tło karty jest tu świadomym kontraktem wizualnym z makiety.
    expect(karta).toHaveClass("bg-[var(--ink-900)]");
    expect(
      within(karta).getByText(
        "To szkolenie kwalifikuje się do dofinansowania z KFS i BUR. Pomożemy Ci przejść przez formalności.",
      ),
    ).toBeInTheDocument();
    const cta = within(karta).getByRole("link", { name: /Sprawdź dofinansowanie/ });
    expect(cta.getAttribute("href")).toBe("/#kontakt");
  });
});
