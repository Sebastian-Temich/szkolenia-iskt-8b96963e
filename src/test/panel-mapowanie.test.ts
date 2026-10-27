import { describe, expect, it } from "vitest";
import {
  szkolenieNaWiersz,
  trenerNaWiersz,
  wierszNaSzkolenie,
  wierszNaTrenera,
} from "@/lib/panel/mapowanie";
import type { SzkolenieWiersz, TrenerWiersz } from "@/lib/panel/typy";
import { wierszSzkolenia, wierszTrenera } from "./atrapa-supabase";

const wiersz = (nadpisz: Partial<SzkolenieWiersz> = {}) =>
  ({ ...wierszSzkolenia(), ...nadpisz }) as SzkolenieWiersz;

describe("mapowanie szkolenia", () => {
  it("kolumna opis staje się polem desc, a for_whom polem forWhom", () => {
    const model = wierszNaSzkolenie(wiersz({ opis: "Treść opisu", for_whom: "Dla analityków" }));
    expect(model.desc).toBe("Treść opisu");
    expect(model.forWhom).toBe("Dla analityków");
    expect("opis" in model).toBe(false);
    expect("for_whom" in model).toBe(false);
  });

  it("w drugą stronę desc wraca do kolumny opis, a forWhom do for_whom", () => {
    const w = szkolenieNaWiersz(wierszNaSzkolenie(wiersz({ opis: "A", for_whom: "B" })));
    expect(w.opis).toBe("A");
    expect(w.for_whom).toBe("B");
    expect("desc" in w).toBe(false);
    expect("forWhom" in w).toBe(false);
  });

  it("terms: null usuwa klucz terms z modelu", () => {
    const model = wierszNaSzkolenie(wiersz({ terms: null }));
    expect("terms" in model).toBe(false);
  });

  it("terms: [] zostaje pustą listą, a nie terminami domyślnymi", () => {
    const model = wierszNaSzkolenie(wiersz({ terms: [] }));
    expect("terms" in model).toBe(true);
    expect(model.terms).toEqual([]);
  });

  it("własna lista terminów przechodzi bez zmian w obie strony", () => {
    const model = wierszNaSzkolenie(wiersz({ terms: ["1 lis 2026 · Online"] }));
    expect(model.terms).toEqual(["1 lis 2026 · Online"]);
    expect(szkolenieNaWiersz(model).terms).toEqual(["1 lis 2026 · Online"]);
  });

  it("model bez klucza terms daje terms: null, a terms: [] daje []", () => {
    const bez = wierszNaSzkolenie(wiersz({ terms: null }));
    expect(szkolenieNaWiersz(bez).terms).toBeNull();
    const pusty = wierszNaSzkolenie(wiersz({ terms: [] }));
    expect(szkolenieNaWiersz(pusty).terms).toEqual([]);
  });

  it("pola redakcyjne mapują się na sortOrder, status i publishedAt", () => {
    const model = wierszNaSzkolenie(wiersz({ sort_order: 7, status: "draft", published_at: null }));
    expect(model.sortOrder).toBe(7);
    expect(model.status).toBe("draft");
    expect(model.publishedAt).toBeNull();
  });
});

describe("mapowanie trenera", () => {
  it("photo_url i sort_order przechodzą w obie strony", () => {
    const w = { ...wierszTrenera(), photo_url: "https://example.org/a.jpg" } as TrenerWiersz;
    const model = wierszNaTrenera(w);
    expect(model.photoUrl).toBe("https://example.org/a.jpg");
    expect(trenerNaWiersz(model)).toEqual(w);
  });
});
