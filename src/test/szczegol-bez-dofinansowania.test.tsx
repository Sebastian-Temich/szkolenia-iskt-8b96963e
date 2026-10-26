import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
import { zamontujTrase } from "./harness-routera";

/**
 * Gałąź szkolenia bez dofinansowania. Karta „Dofinansowanie" twierdzi, że szkolenie
 * kwalifikuje się do KFS i BUR, więc nie może się pokazać przy fundable: false —
 * a bez niej druga kolumna zostałaby pusta, dlatego siatka zwija się do jednej kolumny.
 */
vi.mock("@/lib/szkolenia/adapter", async (importOriginal) => {
  const oryginal = await importOriginal<typeof import("@/lib/szkolenia/adapter")>();
  return {
    ...oryginal,
    getSzkolenie: async (id: string): Promise<Szkolenie | null> => {
      const szkolenie = await oryginal.getSzkolenie(id);
      return szkolenie ? { ...szkolenie, fundable: false } : null;
    },
  };
});

afterEach(cleanup);

describe("Szczegół szkolenia bez dofinansowania", () => {
  it("nie pokazuje karty dofinansowania", async () => {
    await zamontujTrase("/szkolenia/genai");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Generatywne AI dla biznesu",
    );
    expect(screen.queryByRole("complementary", { name: "Dofinansowanie" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Sprawdź dofinansowanie/ })).toBeNull();
  });

  it("zwija siatkę do jednej kolumny, zamiast zostawić pustą", async () => {
    const { container } = await zamontujTrase("/szkolenia/genai");
    const sekcje = [...container.querySelectorAll("main > section")];
    const druga = sekcje[sekcje.length - 1] as HTMLElement;
    expect(druga.className).toContain("lg:grid-cols-1");
    expect(druga.className).not.toContain("lg:grid-cols-[1.35fr_0.65fr]");
  });

  it("nie zmienia pozostałej treści szczegółu", async () => {
    await zamontujTrase("/szkolenia/genai");
    expect(await screen.findByRole("heading", { name: "Czego się nauczysz" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Program szkolenia" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Dla kogo jest to szkolenie" })).toBeVisible();
  });
});
