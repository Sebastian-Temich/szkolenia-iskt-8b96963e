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

function wartoscTokenu(token: string): string {
  const arkusz = readFileSync(join(KORZEN, "styles.css"), "utf8");
  const wartosc = arkusz.match(new RegExp(`${token}\\s*:\\s*([^;]+);`))?.[1];
  if (!wartosc) throw new Error(`Nie znaleziono wartości tokenu ${token}.`);
  return wartosc.replace(/\s+/g, "").toLowerCase();
}

function luminancja(kolor: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(kolor)) {
    throw new Error(`Nieprawidłowy kolor szesnastkowy: ${kolor}.`);
  }
  const kanaly = [1, 3, 5].map((poczatek) => {
    const kanal = parseInt(kolor.slice(poczatek, poczatek + 2), 16) / 255;
    return kanal <= 0.04045 ? kanal / 12.92 : ((kanal + 0.055) / 1.055) ** 2.4;
  });
  return kanaly.reduce((suma, kanal, index) => suma + kanal * [0.2126, 0.7152, 0.0722][index], 0);
}

function kontrast(pierwszy: string, drugi: string): number {
  const a = luminancja(pierwszy);
  const b = luminancja(drugi);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("Kontrast tekstu pomocniczego", () => {
  it("nie stawia --text-muted pod żadnym tekstem", () => {
    // Skan obejmuje także wariant placeholder:, bo placeholder:text-[var(--text-muted)] zawiera szukany fragment.
    const podTekstem = trafienia(TOKEN_ZA_SLABY).filter(
      ({ tresc }) => !tresc.includes("pointer-events-none"),
    );
    expect(podTekstem.map((t) => `${t.plik}:${t.linia}`)).toEqual([]);
  });

  it("nośny tekst pomocniczy stoi na --text-secondary", () => {
    const pliki = new Set(trafienia(TOKEN_POPRAWNY).map((t) => t.plik));
    // Świadomie nie przypinamy tożsamości plików: przeniesienie tekstu pomocniczego nie zmienia kontrastu, a liczba trzyma podłogę pod naprawą D9.
    expect(pliki.size).toBeGreaterThanOrEqual(5);
  });

  it("nie zmienia wartości tokenów marki w arkuszu", () => {
    expect(wartoscTokenu("--neutral-500")).toBe("#7e857a");
    expect(wartoscTokenu("--neutral-600")).toBe("#5b6157");
    expect(wartoscTokenu("--text-muted")).toBe("var(--neutral-500)");
    expect(wartoscTokenu("--text-secondary")).toBe("var(--neutral-600)");
  });

  it("liczy kontrast WCAG 2.1 uzasadniający regułę D9", () => {
    // To powód D9, nie jej powtórzenie: gdy właściciel pociemni token do poziomu AA, test to ujawni i całą regułę będzie można wycofać.
    // WCAG 2.1: luminancja relatywna po korekcie gamma i (jaśniejszy + 0,05) / (ciemniejszy + 0,05).
    const tlo = wartoscTokenu("--neutral-0");
    const slabszy = kontrast(wartoscTokenu("--neutral-500"), tlo);
    const poprawny = kontrast(wartoscTokenu("--neutral-600"), tlo);
    expect(slabszy).toBeLessThan(4.5);
    expect(slabszy).toBeGreaterThanOrEqual(3);
    expect(poprawny).toBeGreaterThanOrEqual(4.5);
  });
});
