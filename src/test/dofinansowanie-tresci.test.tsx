import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route as TrasaGlowna } from "@/routes/index";
import {
  POTWIERDZENIA_HERO,
  SCIEZKI,
  trescHero,
  ZRODLA_DOFINANSOWANIA,
} from "@/components/strona-glowna/tresci";
import { NOTA_CENY } from "@/lib/szkolenia/cena";
import { zamontujTrase } from "./harness-routera";
import { atrapaMakiety } from "./atrapa-klienta";

/**
 * Issue #54 (decyzje.md 2026-11-15, odbiór M3): dofinansowanie „do 95%” zamiast poprzedniej wartości we
 * wszystkich treściach serwisu i „Certyfikat/Egzamin” zamiast „Certyfikat ISKT” w sekcji głównej.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());
afterEach(cleanup);

/** Stara wartość 80 procent (także z odstępem przed znakiem) jako osobna liczba, nie fragment innej. */
const OSIEMDZIESIAT = /(^|[^0-9])80\s?%/;

function plikiZrodel(katalog: string): string[] {
  return readdirSync(katalog).flatMap((nazwa) => {
    const sciezka = join(katalog, nazwa);
    if (statSync(sciezka).isDirectory()) return plikiZrodel(sciezka);
    return /\.(ts|tsx)$/.test(nazwa) ? [sciezka] : [];
  });
}

describe("Dofinansowanie do 95% (#54)", () => {
  it("żaden plik w src nie zawiera starej wartości 80 procent", () => {
    const zKolejnymi = plikiZrodel(resolve("src")).filter((plik) =>
      OSIEMDZIESIAT.test(readFileSync(plik, "utf8")),
    );
    expect(zKolejnymi).toEqual([]);
  });

  it("treści strony głównej i nota ceny mówią o dofinansowaniu do 95%", () => {
    expect(POTWIERDZENIA_HERO[0]).toBe("Dofinansowanie do 95%");
    expect(trescHero("individual").wsparcie).toMatch(/z dofinansowaniem nawet do 95%\.$/);
    expect(trescHero("company").wsparcie).toMatch(/z dofinansowaniem nawet do 95%\.$/);
    expect(SCIEZKI.indywidualna.punkty[0]).toBe("Dofinansowanie BUR do 95%");
    expect(NOTA_CENY).toBe("za osobę · dofinansowanie do 95%");
    expect(ZRODLA_DOFINANSOWANIA.map((z) => [z.skrot, z.opis])).toEqual([
      ["KFS", "Nawet do 100% kosztów dla mikroprzedsiębiorstw i 95% dla pozostałych firm."],
      ["BUR", "Dofinansowanie z funduszy unijnych — do 95% wartości usługi rozwojowej."],
      ["EFS", "Projekty regionalne finansujące rozwój kompetencji pracowników."],
    ]);
  });

  it("meta opis strony głównej mówi o dofinansowaniu nawet do 95%", () => {
    type Meta = { name?: string; property?: string; content?: string };
    const head = TrasaGlowna.options.head as unknown as () => { meta: Meta[] };
    const opisy = head()
      .meta.filter((m) => m.name === "description" || m.property === "og:description")
      .map((m) => m.content);
    expect(opisy).toHaveLength(2);
    for (const opis of opisy) expect(opis).toMatch(/z dofinansowaniem nawet do 95%\.$/);
  });

  it("strona główna pokazuje 95% w hero, ścieżkach i sekcji dofinansowań, bez 80 procent", async () => {
    const { container } = await zamontujTrase("/");
    expect(
      await screen.findByRole("heading", { level: 2, name: "Zapłać nawet o 95% mniej" }),
    ).toBeInTheDocument();
    const tekst = container.textContent ?? "";
    expect(tekst).toContain("Dofinansowanie do 95%");
    expect(tekst).toContain("z dofinansowaniem nawet do 95%.");
    expect(tekst).toContain("Dofinansowanie BUR do 95%");
    expect(tekst).toContain("do 95% wartości usługi rozwojowej");
    expect(tekst).not.toMatch(OSIEMDZIESIAT);
  });

  it("szczegół szkolenia z dofinansowaniem pokazuje znaczek i notę ceny z 95%", async () => {
    const { container } = await zamontujTrase("/szkolenia/genai");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Dofinansowanie do 95%")).toBeInTheDocument();
    expect(screen.getByText("za osobę · dofinansowanie do 95%")).toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(OSIEMDZIESIAT);
  });

  it("katalog nie pokazuje 80 procent", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    await screen.findByRole("heading", { level: 1 });
    expect(container.textContent ?? "").not.toMatch(OSIEMDZIESIAT);
  });
});

describe("Certyfikat/Egzamin (#54)", () => {
  it("potwierdzenia w sekcji głównej: dofinansowanie, Certyfikat/Egzamin, zajęcia z ekspertami", async () => {
    expect(POTWIERDZENIA_HERO).toEqual([
      "Dofinansowanie do 95%",
      "Certyfikat/Egzamin",
      "Zajęcia z ekspertami",
    ]);
    const { container } = await zamontujTrase("/");
    await screen.findByRole("heading", { level: 1 });
    const hero = container.querySelector("section") as HTMLElement;
    expect(within(hero).getByText("Certyfikat/Egzamin")).toBeInTheDocument();
    expect(container.textContent ?? "").not.toContain("Certyfikat ISKT");
  });
});
