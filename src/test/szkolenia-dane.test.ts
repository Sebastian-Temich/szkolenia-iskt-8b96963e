import { beforeEach, describe, expect, it, vi } from "vitest";
import { atrapaMakiety, biezacaAtrapa } from "./atrapa-klienta";
import {
  cenaZDofinansowaniem,
  etykietaCenyGlownej,
  etykietaCenyPelnej,
  filtrujSzkolenia,
  formatujKwote,
  getSzkolenie,
  listSzkolenia,
  opiszLiczbeWynikow,
  terminySzkolenia,
  UDZIAL_WLASNY,
} from "@/lib/szkolenia/adapter";
import { STATUS_OPUBLIKOWANY } from "@/lib/supabase/odczyt";

/**
 * Kontrakt adaptera oferty. Od E02/F źródłem jest Supabase, więc transport jest
 * podstawiony atrapą wypełnioną treścią makiety — a wszystkie zachowania odebrane w E01
 * (filtry, kolejność, ceny, terminy domyślne, niezależne kopie, null dla nieznanego id)
 * są sprawdzane dalej tym samym zestawem asercji. Sztucznego opóźnienia 400 ms już nie ma:
 * należało do warstwy mock i zniknęło razem z nią.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

describe("Dane szkoleń", () => {
  beforeEach(() => atrapaMakiety());
  it.each([
    [298, "298 zł"],
    [1380, "1 380 zł"],
    [0, "0 zł"],
  ])("formatuje kwotę %s", (value, expected) => {
    expect(formatujKwote(Number(value))).toBe(expected);
  });
  it("stosuje dokładnie separator U+202F", () => {
    expect(formatujKwote(1380).charCodeAt(1)).toBe(0x202f);
    expect(formatujKwote(1234567)).toBe("1 234 567 zł");
  });
  // D11: kwota nie może się łamać od symbolu waluty, więc przed „zł" stoi U+00A0,
  // a nie zwykła spacja. Asercja na kod znaku, bo zwykła spacja wygląda identycznie.
  it("oddziela symbol waluty spacją nierozdzielającą U+00A0", () => {
    for (const kwota of [0, 298, 1380, 1234567]) {
      const tekst = formatujKwote(kwota);
      expect(tekst.endsWith(" zł")).toBe(true);
      expect(tekst).not.toContain(" zł");
      expect(tekst.charCodeAt(tekst.length - 3)).toBe(0x00a0);
    }
    expect(etykietaCenyPelnej(1490).startsWith("1 490 zł ")).toBe(true);
  });
  it.each([
    [1490, "298 zł", "1 490 zł bez dofinansowania"],
    [6900, "1 380 zł", "6 900 zł bez dofinansowania"],
  ])("oblicza obie etykiety dla ceny %s", (price, main, full) => {
    expect(etykietaCenyGlownej(Number(price))).toBe(main);
    expect(etykietaCenyPelnej(Number(price))).toBe(full);
  });
  it("udział własny to 20% zaokrąglone do pełnego złotego", () => {
    expect(UDZIAL_WLASNY).toBe(0.2);
    expect(cenaZDofinansowaniem(1493)).toBe(299);
  });
  it("AI zwraca dokładnie dwie zatwierdzone pozycje", async () => {
    expect((await listSzkolenia({ kategoria: "AI" })).map((s) => s.id)).toEqual([
      "genai",
      "ai-agents",
    ]);
  });
  it("Wszystkie i brak kategorii zwracają dziewięć pozycji", async () => {
    const all = await listSzkolenia({ kategoria: "Wszystkie" });
    expect(all).toHaveLength(9);
    expect(filtrujSzkolenia(all)).toHaveLength(9);
  });
  it("szuka csrd również w opisie", async () => {
    const all = await listSzkolenia();
    const esg = all.find((s) => s.id === "esg");
    expect(esg?.desc.toLocaleLowerCase("pl-PL")).toContain("csrd");
    expect(
      filtrujSzkolenia(
        all.map((s) => ({ ...s, title: "Temat" })),
        { q: "csrd" },
      ).map((s) => s.id),
    ).toEqual(["esg"]);
  });
  it("szuka kategorii bez uwzględniania wielkości liter", async () => {
    const all = await listSzkolenia();
    expect(
      filtrujSzkolenia(
        all.map((s) => ({ ...s, title: "Temat" })),
        { q: "ANGIELSKI" },
      ).map((s) => s.id),
    ).toEqual(["eng-b2", "eng-it"]);
  });
  it("łączy kategorię z trimowaną frazą", async () => {
    expect(
      (await listSzkolenia({ kategoria: "Software", q: " python " })).map((s) => s.id),
    ).toEqual(["python"]);
  });
  it("pusta fraza nie zawęża", async () => {
    expect(await listSzkolenia({ q: "   " })).toHaveLength(9);
  });
  it("obsługuje pusty wynik", async () => {
    expect(await listSzkolenia({ q: "zzz" })).toEqual([]);
    expect(opiszLiczbeWynikow(0)).toBe("0 szkoleń");
  });
  it.each([
    [1, "1 szkolenie"],
    [2, "2 szkolenia"],
    [5, "5 szkoleń"],
    [9, "9 szkoleń"],
    [12, "12 szkoleń"],
    [21, "21 szkoleń"],
    [22, "22 szkolenia"],
    [24, "24 szkolenia"],
    [25, "25 szkoleń"],
    [112, "112 szkoleń"],
  ])("odmienia %s", (count, expected) => {
    expect(opiszLiczbeWynikow(Number(count))).toBe(expected);
  });
  it("zwraca null dla nieznanego id", async () => {
    expect(await getSzkolenie("nie-istnieje")).toBeNull();
  });
  it("zwraca cenę genai równą 1490", async () => {
    expect((await getSzkolenie("genai"))?.price).toBe(1490);
  });
  it("zachowuje kolejność i ceny wszystkich dziewięciu szkoleń", async () => {
    const all = await listSzkolenia();
    expect(all.map((s) => [s.id, s.price])).toEqual([
      ["genai", 1490],
      ["esg", 2190],
      ["eng-b2", 2900],
      ["fullstack", 6900],
      ["ai-agents", 1990],
      ["co2", 990],
      ["python", 1690],
      ["grants", 1290],
      ["eng-it", 2200],
    ]);
    expect(new Set(all.map((s) => s.id)).size).toBe(9);
    for (const s of all) {
      expect(s.learn).toHaveLength(4);
      expect(s.program.map((m) => m.n)).toEqual(["01", "02", "03", "04"]);
    }
  });
  it("zwraca trzy dokładne terminy domyślne", async () => {
    const item = await getSzkolenie("genai");
    if (!item) throw new Error("Brak genai");
    expect(terminySzkolenia(item)).toEqual([
      "12–13 wrz 2026 · Online",
      "3–4 paź 2026 · Warszawa",
      "Termin ustalany indywidualnie",
    ]);
    expect(terminySzkolenia({ ...item, terms: ["Własny termin"] })).toEqual(["Własny termin"]);
    expect(terminySzkolenia({ ...item, terms: [] })).toEqual([]);
  });
  it("widok nie może mutować danych źródła", async () => {
    const item = await getSzkolenie("genai");
    if (!item) throw new Error("Brak genai");
    item.price = 1;
    item.learn[0] = "zmiana";
    const all = await listSzkolenia();
    expect(all[0]?.price).toBe(1490);
    expect(all[0]?.learn[0]).toBe("Skuteczne prompty i konteksty");
    all[0]?.program.splice(0);
    expect((await getSzkolenie("genai"))?.program).toHaveLength(4);
  });
  it("terms: [] z bazy zostaje pustą listą, a nie fallbackiem", async () => {
    const wiersz = biezacaAtrapa().dane["szkolenia"]?.find((w) => w["id"] === "genai");
    if (!wiersz) throw new Error("test: brak wiersza genai");
    wiersz["terms"] = [];
    const item = await getSzkolenie("genai");
    if (!item) throw new Error("test: brak genai");
    // Klucz jest obecny i pusty — „brak terminów", nie „terminy domyślne".
    expect("terms" in item).toBe(true);
    expect(item.terms).toEqual([]);
    expect(terminySzkolenia(item)).toEqual([]);
  });

  it("terms: null z bazy usuwa klucz, więc działa fallback na terminy domyślne", async () => {
    const wiersz = biezacaAtrapa().dane["szkolenia"]?.find((w) => w["id"] === "genai");
    if (!wiersz) throw new Error("test: brak wiersza genai");
    expect(wiersz["terms"]).toBeNull();
    const item = await getSzkolenie("genai");
    if (!item) throw new Error("test: brak genai");
    expect("terms" in item).toBe(false);
    expect(terminySzkolenia(item)).toHaveLength(3);
  });

  it("własne terminy z bazy wygrywają z domyślnymi", async () => {
    const wiersz = biezacaAtrapa().dane["szkolenia"]?.find((w) => w["id"] === "genai");
    if (!wiersz) throw new Error("test: brak wiersza genai");
    wiersz["terms"] = ["5 maja 2027 · Katowice"];
    const item = await getSzkolenie("genai");
    if (!item) throw new Error("test: brak genai");
    expect(terminySzkolenia(item)).toEqual(["5 maja 2027 · Katowice"]);
  });

  it("jedno zapytanie do bazy, z filtrem statusu i bez sztucznego opóźnienia", async () => {
    const start = Date.now();
    await listSzkolenia({ kategoria: "AI" });
    expect(Date.now() - start).toBeLessThan(200);

    const odczyty = biezacaAtrapa().gdzie("szkolenia", "select");
    expect(odczyty).toHaveLength(1);
    expect(odczyty[0]?.filtry).toEqual([
      { kolumna: "status", operator: "eq", wartosc: STATUS_OPUBLIKOWANY },
    ]);
    // Filtr kategorii zostaje po stronie klienta — ta sama semantyka, co w E01.
    expect(odczyty[0]?.filtry.map((f) => f.kolumna)).not.toContain("cat");
  });
});
