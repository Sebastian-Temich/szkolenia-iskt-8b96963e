import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
import { zamontujTrase } from "./harness-routera";
import { atrapaMakiety, biezacaAtrapa } from "./atrapa-klienta";

/**
 * Źródłem danych widoków publicznych jest Supabase, więc test podstawia klienta bazy
 * atrapą wypełnioną treścią makiety. Trasy, loadery, mapery i komponenty zostają
 * produkcyjne — podmieniony jest wyłącznie transport do bazy.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());

/**
 * Gałąź szkolenia bez dofinansowania. Karta „Dofinansowanie" twierdzi, że szkolenie
 * kwalifikuje się do KFS i BUR, więc nie może się pokazać przy fundable: false.
 *
 * Inwariant z E01 brzmiał „bez karty dofinansowania druga kolumna zostałaby pusta, więc
 * siatka zwija się do jednej". W E02/F w tej kolumnie stoi też blok prowadzących, więc
 * inwariantem jest teraz: **siatka zwija się dokładnie wtedy, gdy kolumna boczna nie ma
 * nic do pokazania**. Oba warunki są sprawdzane osobno poniżej.
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

  async function drugaSekcja(): Promise<HTMLElement> {
    const program = await screen.findByRole("heading", { name: "Program szkolenia" });
    const sekcja = program.closest("main > section");
    expect(sekcja).not.toBeNull();
    return sekcja as HTMLElement;
  }

  it("bez dofinansowania, ale z prowadzącymi zostawia kolumnę boczną na prowadzących", async () => {
    await zamontujTrase("/szkolenia/genai");
    const druga = await drugaSekcja();
    expect(within(druga).queryByRole("complementary", { name: "Dofinansowanie" })).toBeNull();
    expect(within(druga).getByRole("heading", { name: "Prowadzący" })).toBeVisible();
    // Klasy siatki to świadomy kontrakt z makietą: dwie kolumny tylko wtedy, gdy prawa ma treść.
    expect(druga.className).toContain("lg:grid-cols-[1.35fr_0.65fr]");
    expect(druga.className).not.toContain("lg:grid-cols-1");
  });

  it("bez dofinansowania i bez prowadzących zwija siatkę do jednej kolumny", async () => {
    biezacaAtrapa().dane["szkolenie_trener"] = [];
    await zamontujTrase("/szkolenia/genai");
    const druga = await drugaSekcja();
    expect(within(druga).queryByRole("complementary", { name: "Dofinansowanie" })).toBeNull();
    expect(screen.queryByRole("heading", { name: /^Prowadzący/ })).toBeNull();
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
