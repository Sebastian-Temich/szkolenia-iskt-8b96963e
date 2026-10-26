import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
import { zamontujTrase, zamontujTraseBezCzekania } from "./harness-routera";

/**
 * Cztery stany UI katalogu i szczegółu: ładowanie, pusty wynik, błąd pobrania z ponowieniem
 * oraz nieznane szkolenie. Sterowany jest wyłącznie adapter danych — trasy, loadery,
 * komponenty stanów i router to kod produkcyjny.
 */
const stan = vi.hoisted(() => ({
  tryb: "ok" as "ok" | "blad" | "wisi",
  wywolaniaListy: 0,
  wywolaniaSzczegolu: 0,
  pusto: false,
  nieznane: false,
}));

vi.mock("@/lib/szkolenia/adapter", async (importOriginal) => {
  const oryginal = await importOriginal<typeof import("@/lib/szkolenia/adapter")>();
  return {
    ...oryginal,
    listSzkolenia: async (filtr: Parameters<typeof oryginal.listSzkolenia>[0] = {}) => {
      stan.wywolaniaListy += 1;
      if (stan.tryb === "wisi") return new Promise<Szkolenie[]>(() => {});
      if (stan.tryb === "blad") throw new Error("test: awaria adaptera listy");
      const { SZKOLENIA_MOCK } = await import("@/lib/szkolenia/mock-dane");
      return stan.pusto ? [] : oryginal.filtrujSzkolenia(SZKOLENIA_MOCK, filtr);
    },
    getSzkolenie: async (id: string) => {
      stan.wywolaniaSzczegolu += 1;
      if (stan.tryb === "wisi") return new Promise<Szkolenie | null>(() => {});
      if (stan.tryb === "blad") throw new Error("test: awaria adaptera szczegolu");
      if (stan.nieznane) return null;
      const { SZKOLENIA_MOCK } = await import("@/lib/szkolenia/mock-dane");
      return SZKOLENIA_MOCK.find((item) => item.id === id) ?? null;
    },
  };
});

beforeEach(() => {
  stan.tryb = "ok";
  stan.wywolaniaListy = 0;
  stan.wywolaniaSzczegolu = 0;
  stan.pusto = false;
  stan.nieznane = false;
});
afterEach(cleanup);

describe("Stan 1 z 4 — ładowanie", () => {
  it("katalog pokazuje szkielet z aria-busy, dopóki adapter nie odpowie", async () => {
    stan.tryb = "wisi";
    zamontujTraseBezCzekania("/szkolenia");
    const szkielet = await screen.findByLabelText("Wczytujemy katalog szkoleń");
    expect(szkielet).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("status")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Znajdź szkolenie dla siebie lub zespołu" }),
    ).toBeVisible();
  });

  it("szczegół pokazuje szkielet z aria-busy, dopóki adapter nie odpowie", async () => {
    stan.tryb = "wisi";
    zamontujTraseBezCzekania("/szkolenia/genai");
    const szkielet = await screen.findByLabelText("Wczytujemy szkolenie");
    expect(szkielet).toHaveAttribute("aria-busy", "true");
  });
});

describe("Stan 2 z 4 — pusty wynik", () => {
  it("pokazuje stan pusty z wyjściem, a nie pustą siatkę", async () => {
    stan.pusto = true;
    const { container } = await zamontujTrase("/szkolenia");
    expect(screen.getByRole("status")).toHaveTextContent("0 szkoleń");
    expect(screen.getByRole("heading", { name: "Brak szkoleń dla tych kryteriów" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Wyczyść filtry" })).toBeEnabled();
    expect(container.querySelectorAll('a[href^="/szkolenia/"]')).toHaveLength(0);
  });
});

describe("Stan 3 z 4 — błąd pobrania", () => {
  it("katalog pokazuje komunikat po polsku bez treści wyjątku", async () => {
    stan.tryb = "blad";
    const { container } = await zamontujTrase("/szkolenia");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nie udało się wczytać katalogu" })).toBeVisible();
    expect(container.textContent).not.toContain("awaria adaptera");
    expect(container.textContent).not.toContain("Error");
  });

  it("ponowienie faktycznie unieważnia loader, a nie tylko chowa komunikat", async () => {
    const user = userEvent.setup();
    stan.tryb = "blad";
    await zamontujTrase("/szkolenia");
    await screen.findByRole("alert");
    const przed = stan.wywolaniaListy;
    expect(przed).toBeGreaterThan(0);

    stan.tryb = "ok";
    await user.click(screen.getByRole("button", { name: /Spróbuj ponownie/ }));

    await waitFor(() => expect(stan.wywolaniaListy).toBeGreaterThan(przed));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("9 szkoleń"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("szczegół pokazuje własny komunikat błędu i też da się ponowić", async () => {
    const user = userEvent.setup();
    stan.tryb = "blad";
    await zamontujTrase("/szkolenia/genai");
    expect(screen.getByRole("heading", { name: "Nie udało się wczytać szkolenia" })).toBeVisible();
    const przed = stan.wywolaniaSzczegolu;

    stan.tryb = "ok";
    await user.click(screen.getByRole("button", { name: /Spróbuj ponownie/ }));

    await waitFor(() => expect(stan.wywolaniaSzczegolu).toBeGreaterThan(przed));
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Generatywne AI dla biznesu",
      ),
    );
  });
});

describe("Stan 4 z 4 — nieznane szkolenie", () => {
  it("loader rzuca notFound, a widok daje drogę powrotu do katalogu", async () => {
    stan.nieznane = true;
    await zamontujTrase("/szkolenia/nie-istnieje");
    expect(screen.getByRole("heading", { name: "Nie znaleźliśmy tego szkolenia" })).toBeVisible();
    const powrot = screen.getByRole("link", { name: /Wróć do katalogu/ });
    expect(powrot.getAttribute("href")).toBe("/szkolenia");
  });

  it("nieznane szkolenie nie pokazuje szkieletu ani komunikatu błędu pobrania", async () => {
    stan.nieznane = true;
    await zamontujTrase("/szkolenia/nie-istnieje");
    expect(screen.queryByLabelText("Wczytujemy szkolenie")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Nie udało się wczytać szkolenia" })).toBeNull();
  });
});
