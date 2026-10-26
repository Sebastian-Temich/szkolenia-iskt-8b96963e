import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

async function resolveMock<T>(promise: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promise;
}

describe("Dane szkoleń", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it.each([
    [298, "298 zł"],
    [1380, "1\u202F380 zł"],
    [0, "0 zł"],
  ])("formatuje kwotę %s", (value, expected) => {
    expect(formatujKwote(Number(value))).toBe(expected);
  });
  it("stosuje dokładnie separator U+202F", () => {
    expect(formatujKwote(1380).charCodeAt(1)).toBe(0x202f);
    expect(formatujKwote(1234567)).toBe("1\u202F234\u202F567 zł");
  });
  it.each([
    [1490, "298 zł", "1\u202F490 zł bez dofinansowania"],
    [6900, "1\u202F380 zł", "6\u202F900 zł bez dofinansowania"],
  ])("oblicza obie etykiety dla ceny %s", (price, main, full) => {
    expect(etykietaCenyGlownej(Number(price))).toBe(main);
    expect(etykietaCenyPelnej(Number(price))).toBe(full);
  });
  it("udział własny to 20% zaokrąglone do pełnego złotego", () => {
    expect(UDZIAL_WLASNY).toBe(0.2);
    expect(cenaZDofinansowaniem(1493)).toBe(299);
  });
  it("AI zwraca dokładnie dwie zatwierdzone pozycje", async () => {
    expect((await resolveMock(listSzkolenia({ kategoria: "AI" }))).map((s) => s.id)).toEqual([
      "genai",
      "ai-agents",
    ]);
  });
  it("Wszystkie i brak kategorii zwracają dziewięć pozycji", async () => {
    const all = await resolveMock(listSzkolenia({ kategoria: "Wszystkie" }));
    expect(all).toHaveLength(9);
    expect(filtrujSzkolenia(all)).toHaveLength(9);
  });
  it("szuka csrd również w opisie", async () => {
    const all = await resolveMock(listSzkolenia());
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
    const all = await resolveMock(listSzkolenia());
    expect(
      filtrujSzkolenia(
        all.map((s) => ({ ...s, title: "Temat" })),
        { q: "ANGIELSKI" },
      ).map((s) => s.id),
    ).toEqual(["eng-b2", "eng-it"]);
  });
  it("łączy kategorię z trimowaną frazą", async () => {
    expect(
      (await resolveMock(listSzkolenia({ kategoria: "Software", q: " python " }))).map((s) => s.id),
    ).toEqual(["python"]);
  });
  it("pusta fraza nie zawęża", async () => {
    expect(await resolveMock(listSzkolenia({ q: "   " }))).toHaveLength(9);
  });
  it("obsługuje pusty wynik", async () => {
    expect(await resolveMock(listSzkolenia({ q: "zzz" }))).toEqual([]);
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
    expect(await resolveMock(getSzkolenie("nie-istnieje"))).toBeNull();
  });
  it("zwraca cenę genai równą 1490", async () => {
    expect((await resolveMock(getSzkolenie("genai")))?.price).toBe(1490);
  });
  it("zachowuje kolejność i ceny wszystkich dziewięciu szkoleń", async () => {
    const all = await resolveMock(listSzkolenia());
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
    const item = await resolveMock(getSzkolenie("genai"));
    if (!item) throw new Error("Brak genai");
    expect(terminySzkolenia(item)).toEqual([
      "12–13 wrz 2026 · Online",
      "3–4 paź 2026 · Warszawa",
      "Termin ustalany indywidualnie",
    ]);
    expect(terminySzkolenia({ ...item, terms: ["Własny termin"] })).toEqual(["Własny termin"]);
    expect(terminySzkolenia({ ...item, terms: [] })).toEqual([]);
  });
  it("widok nie może mutować danych mock", async () => {
    const item = await resolveMock(getSzkolenie("genai"));
    if (!item) throw new Error("Brak genai");
    item.price = 1;
    item.learn[0] = "zmiana";
    const all = await resolveMock(listSzkolenia());
    expect(all[0]?.price).toBe(1490);
    expect(all[0]?.learn[0]).toBe("Skuteczne prompty i konteksty");
    all[0]?.program.splice(0);
    expect((await resolveMock(getSzkolenie("genai")))?.program).toHaveLength(4);
  });
  it("mock czeka 400 ms, a demonstracyjne ładowanie 8000 ms", async () => {
    const normal = vi.fn();
    const slow = vi.fn();
    const first = listSzkolenia().then(normal);
    const second = listSzkolenia({ demo: "ladowanie" }).then(slow);
    await vi.advanceTimersByTimeAsync(399);
    expect(normal).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(normal).toHaveBeenCalledOnce();
    expect(slow).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(7599);
    expect(slow).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(slow).toHaveBeenCalledOnce();
    await Promise.all([first, second]);
  });
  it("oba pobrania obsługują demonstracyjny błąd", async () => {
    const list = expect(listSzkolenia({ demo: "blad" })).rejects.toThrow(
      "Nie udało się pobrać listy szkoleń",
    );
    const detail = expect(getSzkolenie("genai", { demo: "blad" })).rejects.toThrow(
      "Nie udało się pobrać szkolenia",
    );
    await vi.runAllTimersAsync();
    await Promise.all([list, detail]);
  });
});
