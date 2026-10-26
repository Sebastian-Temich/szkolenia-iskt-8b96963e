import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * D9: token --text-muted (#7E857A) daje na białym 3.80:1, a WCAG AA wymaga 4.5:1 dla małego
 * tekstu. Wartości tokenu nie zmieniamy, bo pochodzi 1:1 z pakietu marki — pilnujemy więc,
 * żeby nie stał pod tekstem. Jedyne dopuszczone użycie to element dekoracyjny: ikona
 * z pointer-events-none i aria-hidden, dla której próg AA to 3:1.
 *
 * Skan źródeł, nie renderu: jsdom nie liczy kontrastu, a klasa w kodzie jest tym, co trafia
 * na produkcję.
 */
const KORZEN = join(import.meta.dirname, "..");
const TOKEN_ZA_SLABY = "text-[var(--text-muted)]";
const TOKEN_POPRAWNY = "text-[var(--text-secondary)]";

function plikiZrodel(katalog: string): string[] {
  return readdirSync(katalog).flatMap((wpis) => {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) return plikiZrodel(sciezka);
    return /\.tsx?$/.test(wpis) && !/\.test\.tsx?$/.test(wpis) ? [sciezka] : [];
  });
}

type Trafienie = { plik: string; linia: number; tresc: string };

function trafienia(fragment: string): Trafienie[] {
  return plikiZrodel(KORZEN).flatMap((sciezka) =>
    readFileSync(sciezka, "utf8")
      .split("\n")
      .map((tresc, index) => ({ plik: relative(KORZEN, sciezka), linia: index + 1, tresc }))
      .filter(({ tresc }) => tresc.includes(fragment)),
  );
}

describe("Kontrast tekstu pomocniczego", () => {
  it("nie stawia --text-muted pod żadnym tekstem", () => {
    const podTekstem = trafienia(TOKEN_ZA_SLABY).filter(
      ({ tresc }) => !tresc.includes("pointer-events-none"),
    );
    expect(podTekstem.map((t) => `${t.plik}:${t.linia}`)).toEqual([]);
  });

  it("nie używa --text-muted w podpowiedzi pola, bo to też tekst", () => {
    expect(trafienia("placeholder:text-[var(--text-muted)]")).toEqual([]);
  });

  it("nośny tekst pomocniczy stoi na --text-secondary", () => {
    const pliki = new Set(trafienia(TOKEN_POPRAWNY).map((t) => t.plik));
    for (const oczekiwany of [
      "components/szkolenia/BlokCeny.tsx",
      "components/szkolenia/MetrykiSzkolenia.tsx",
      "components/brand/Footer.tsx",
      "components/szkolenia/FiltryKatalogu.tsx",
      "routes/szkolenia/index.tsx",
    ]) {
      expect([...pliki]).toContain(oczekiwany);
    }
  });

  it("nie zmienia wartości tokenów marki w arkuszu", () => {
    const arkusz = readFileSync(join(KORZEN, "styles.css"), "utf8");
    expect(arkusz).toContain("--neutral-500: #7E857A;");
    expect(arkusz).toContain("--neutral-600: #5B6157;");
    expect(arkusz).toContain("--text-muted: var(--neutral-500);");
    expect(arkusz).toContain("--text-secondary: var(--neutral-600);");
  });
});
