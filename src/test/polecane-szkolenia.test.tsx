import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
import { zamontujTrase } from "./harness-routera";

/**
 * Trzy stany sekcji „Najczęściej wybierane" na stronie głównej: ładowanie, błąd
 * z działającym ponowieniem i dane w kolejności właściciela. Sterowany jest tylko adapter.
 */
const stan = vi.hoisted(() => ({
  tryb: "ok" as "ok" | "blad" | "wisi",
  wywolania: 0,
  identyfikatory: ["python", "eng-b2", "co2", "fullstack", "esg", "genai"],
}));

vi.mock("@/lib/szkolenia/adapter", async (importOriginal) => {
  const oryginal = await importOriginal<typeof import("@/lib/szkolenia/adapter")>();
  return {
    ...oryginal,
    listSzkolenia: async () => {
      stan.wywolania += 1;
      if (stan.tryb === "wisi") return new Promise<Szkolenie[]>(() => {});
      if (stan.tryb === "blad") throw new Error("test: awaria adaptera polecanych");
      const { SZKOLENIA_MOCK } = await import("@/lib/szkolenia/mock-dane");
      return stan.identyfikatory
        .map((id) => SZKOLENIA_MOCK.find((item) => item.id === id))
        .filter((item): item is Szkolenie => item !== undefined);
    },
  };
});

const sekcja = () => screen.getByRole("region", { name: "Najczęściej wybierane" });
// Szkielet polecanych to <div aria-busy>, a nie element z rolą - aria-label na elemencie
// bez roli jest ignorowane przez technologie asystujące, więc szukam po atrybucie.
// Sam fakt tej różnicy wobec szkieletu katalogu należy do zaległości a11y, nie do tej karty.
const szkielet = () =>
  document.querySelector('[aria-busy="true"][aria-label="Wczytujemy polecane szkolenia"]');
const tytulyKart = () =>
  [...sekcja().querySelectorAll('a[href^="/szkolenia/"] h2')].map((h) => h.textContent);

beforeEach(() => {
  stan.tryb = "ok";
  stan.wywolania = 0;
  stan.identyfikatory = ["python", "eng-b2", "co2", "fullstack", "esg", "genai"];
});
afterEach(cleanup);

describe("Polecane szkolenia — stan ładowania", () => {
  it("pokazuje szkielet z aria-busy, dopóki adapter nie odpowie", async () => {
    stan.tryb = "wisi";
    // Trasa "/" nie ma loadera, wiec router kończy load od razu; wiszące zapytanie
    // react-query trzyma sekcję w stanie ładowania, nie router.
    await zamontujTrase("/");
    await waitFor(() => expect(szkielet()).not.toBeNull());
    expect(tytulyKart()).toEqual([]);
  });

  it("nagłówek i wyjście do katalogu są widoczne już w trakcie ładowania", async () => {
    stan.tryb = "wisi";
    // Trasa "/" nie ma loadera, wiec router kończy load od razu; wiszące zapytanie
    // react-query trzyma sekcję w stanie ładowania, nie router.
    await zamontujTrase("/");
    await waitFor(() => expect(szkielet()).not.toBeNull());
    expect(await screen.findByRole("heading", { name: "Najczęściej wybierane" })).toBeVisible();
    expect(screen.getByText("Wyróżnione szkolenia")).toBeVisible();
    expect(screen.getByRole("link", { name: /Cały katalog/ }).getAttribute("href")).toBe(
      "/szkolenia",
    );
  });
});

describe("Polecane szkolenia — stan gotowy", () => {
  it("pokazuje cztery karty w kolejności właściciela, nie w kolejności adaptera", async () => {
    await zamontujTrase("/");
    await waitFor(() => expect(tytulyKart()).toHaveLength(4));
    expect(tytulyKart()).toEqual([
      "Generatywne AI dla biznesu",
      "Raportowanie ESG wg CSRD",
      "Fullstack Web Developer",
      "Angielski biznesowy B2",
    ]);
    expect(szkielet()).toBeNull();
  });

  it("gdy adapter zwróci tylko część polecanych, pokazuje tylko je", async () => {
    stan.identyfikatory = ["esg", "genai", "python"];
    await zamontujTrase("/");
    await waitFor(() => expect(tytulyKart()).toHaveLength(2));
    expect(tytulyKart()).toEqual(["Generatywne AI dla biznesu", "Raportowanie ESG wg CSRD"]);
  });

  it("przy pustym wyniku nie pokazuje pustej siatki ani przycisku ponowienia", async () => {
    stan.identyfikatory = [];
    await zamontujTrase("/");
    await waitFor(() =>
      expect(await screen.findByText("Nie znaleźliśmy polecanych szkoleń")).toBeInTheDocument(),
    );
    expect(tytulyKart()).toEqual([]);
    expect(screen.queryByRole("button", { name: /Spróbuj ponownie/ })).toBeNull();
  });
});

describe("Polecane szkolenia — stan błędu", () => {
  it("pokazuje komunikat po polsku, bez treści wyjątku", async () => {
    stan.tryb = "blad";
    await zamontujTrase("/");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Nie udało się wczytać polecanych szkoleń");
    expect(alert.textContent).not.toContain("awaria adaptera");
    expect(alert.textContent).not.toContain("Error");
  });

  it("ponowienie faktycznie woła adapter jeszcze raz i czyści komunikat", async () => {
    const user = userEvent.setup();
    stan.tryb = "blad";
    await zamontujTrase("/");
    await screen.findByRole("alert");
    const przed = stan.wywolania;

    stan.tryb = "ok";
    await user.click(screen.getByRole("button", { name: /Spróbuj ponownie/ }));

    await waitFor(() => expect(stan.wywolania).toBeGreaterThan(przed));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(tytulyKart()).toHaveLength(4);
  });

  it("stan błędu zostawia wyjście do katalogu", async () => {
    stan.tryb = "blad";
    await zamontujTrase("/");
    const alert = await screen.findByRole("alert");
    const wyjscie = [...alert.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(wyjscie).toContain("/szkolenia");
  });
});
