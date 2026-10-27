import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SZKOLENIA_MOCK } from "@/lib/szkolenia/mock-dane";
import { atrapaMakiety, biezacaAtrapa } from "./atrapa-klienta";
import { adres, zamontujTrase } from "./harness-routera";

/**
 * Dwie rzeczy, które podmiana źródła danych najłatwiej psuje po cichu:
 *
 * 1. **Stare adresy.** `/szkolenia/$id` ma dalej działać dla tych samych dziewięciu
 *    identyfikatorów co w E01. Segment adresu jest kolumną `id` w bazie, a nie slugiem
 *    wyliczonym z tytułu — więc zmiana tytułu w panelu nie może przestawić linku.
 * 2. **Format ceny.** Baza trzyma cenę jako liczbę; cała prezentacja (U+202F w tysiącach,
 *    U+00A0 przed „zł", udział własny 20%) zostaje w `cena.ts`.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());
afterEach(cleanup);

const IDENTYFIKATORY = SZKOLENIA_MOCK.map((s) => s.id);

describe("Stare adresy szkoleń dalej działają", () => {
  it.each(IDENTYFIKATORY)("adres /szkolenia/%s pokazuje tytuł właściciela", async (id) => {
    const oczekiwany = SZKOLENIA_MOCK.find((s) => s.id === id);
    if (!oczekiwany) throw new Error(`oracle: brak ${id}`);
    await zamontujTrase(`/szkolenia/${id}`);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(oczekiwany.title);
    expect(screen.queryByRole("heading", { name: "Nie znaleźliśmy tego szkolenia" })).toBeNull();
  });

  it("segment adresu to kolumna id, nie slug tytułu", async () => {
    const wiersz = biezacaAtrapa().dane["szkolenia"]?.find((w) => w["id"] === "genai");
    if (!wiersz) throw new Error("test: brak wiersza genai");
    wiersz["title"] = "Zupełnie nowy tytuł po redakcji";

    const { router, container } = await zamontujTrase("/szkolenia/genai");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Zupełnie nowy tytuł po redakcji",
    );
    expect(adres(router)).toBe("/szkolenia/genai");
    cleanup();
    expect(container).toBeDefined();

    const katalog = await zamontujTrase("/szkolenia");
    await screen.findByRole("status");
    expect(katalog.container.querySelector('a[href^="/szkolenia/zupelnie-nowy-tytul"]')).toBeNull();
    expect(katalog.container.querySelector('a[href^="/szkolenia/genai"]')).not.toBeNull();
  });

  it("filtry z adresu wracają razem z powrotem ze szczegółu", async () => {
    const user = userEvent.setup();
    const { router } = await zamontujTrase("/szkolenia?kategoria=AI&q=agentami");
    expect(await screen.findByRole("status")).toHaveTextContent("1 szkolenie");
    await user.click(screen.getByRole("link", { name: /Szczegóły/ }));
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Automatyzacja z agentami AI",
    );
    expect(adres(router)).toBe("/szkolenia/ai-agents?kategoria=AI&q=agentami");

    const okruszki = screen.getByRole("navigation", { name: "Ścieżka nawigacji" });
    await user.click(within(okruszki).getByRole("link", { name: "Katalog" }));
    await screen.findByRole("status");
    expect(adres(router)).toBe("/szkolenia?kategoria=AI&q=agentami");
  });
});

describe("Format ceny po podmianie źródła", () => {
  it("karta katalogu formatuje liczbę z bazy dokładnie jak w E01", async () => {
    await zamontujTrase("/szkolenia?kategoria=AI&q=generatywne");
    await screen.findByRole("status");
    const karta = screen.getByRole("link", { name: /Szczegóły/ });
    const tekst = karta.textContent ?? "";
    expect(tekst).toContain("298 zł");
    expect(tekst).toContain("1 490 zł");
    // Zwykła spacja U+0020 przed „zł" byłaby regresją D11 — wygląda identycznie.
    expect(tekst).not.toContain(" zł");
  });

  it("cena jest liczbą w bazie, a formatowanie zostaje w widoku", async () => {
    const wiersz = biezacaAtrapa().dane["szkolenia"]?.find((w) => w["id"] === "genai");
    if (!wiersz) throw new Error("test: brak wiersza genai");
    expect(typeof wiersz["price"]).toBe("number");
    wiersz["price"] = 1234567;

    const { container } = await zamontujTrase("/szkolenia/genai");
    await screen.findByRole("heading", { level: 1 });
    const tekst = container.textContent ?? "";
    expect(tekst).toContain("246 913 zł");
    expect(tekst).toContain("1 234 567 zł bez dofinansowania");
    expect(tekst).not.toContain("1234567");
  });
});
