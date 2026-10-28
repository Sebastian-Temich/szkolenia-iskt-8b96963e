import { beforeEach, describe, expect, it, vi } from "vitest";
import { biezacaAtrapa, ustawAtrape } from "./atrapa-klienta";
import { utworzAtrape, wierszSzkolenia, wierszTrenera } from "./atrapa-supabase";
import { odczytajPrzypisania, zapiszPrzypisania } from "@/lib/panel/przypisania-repo";
import { szkoleniaTrenera, trenerzySzkolenia } from "@/lib/trenerzy/adapter";

vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

/**
 * Dowód R1 + R7 (ISK-59): relacja szkolenie↔trener niesie DWIE niezależne
 * kolejności. Zapis z jednej strony nie może ruszyć kolejności drugiej strony —
 * ani w panelu (przypisania-repo), ani w widokach publicznych (adapter).
 *
 * Oracle jest asercją na STANIE po odczycie OBU stron, nie na kształcie zapytania.
 * Dane odtwarzają scenariusz remisu z sekcji R1 przeglądu (`seed_lokalny.sql:109-115`):
 * wiersz współdzielony (genai × nowak) należy jednocześnie do listy trenerów szkolenia
 * i do listy szkoleń trenera. Pod starą jedną kolumną zapis z jednej strony klobrował
 * wartość widzianą przez drugą; wartości dobrane tak, by klobrowanie dawało porządek
 * JAWNIE inny (bez remisu), więc test pada deterministycznie, nie losowo.
 *
 * Kontrola mutacyjna: `.work/isk59/skrypty/mutacja.py` (tryby A1/A2/A3) cofa poprawkę
 * w kodzie produkcyjnym do jednej wspólnej kolumny; każdy tryb czerwieni dokładnie
 * tę asercję, która pilnuje danej strony. Czyste drzewo = wszystkie zielone.
 */

describe("R1/R7 panel — zapis jednej strony nie rusza kolejności drugiej", () => {
  // Wiersz współdzielony: (genai × nowak). nowak prowadzi też ai-agents i python.
  const rows = [
    { szkolenie_id: "genai", trener_id: "nowak", sort_order_trener: 0, sort_order_szkolenie: 0 },
    { szkolenie_id: "genai", trener_id: "krol", sort_order_trener: 1, sort_order_szkolenie: 0 },
    { szkolenie_id: "ai-agents", trener_id: "nowak", sort_order_trener: 0, sort_order_szkolenie: 1 },
    { szkolenie_id: "python", trener_id: "nowak", sort_order_trener: 0, sort_order_szkolenie: 2 },
  ];

  beforeEach(() => ustawAtrape(utworzAtrape({ szkolenie_trener: structuredClone(rows) })));

  it("przestawienie szkoleń na stronie trenera nie zmienia kolejności trenerów przy szkoleniu", async () => {
    // stan początkowy obu stron
    expect(await odczytajPrzypisania("szkolenie", "genai")).toEqual(["nowak", "krol"]);
    expect(await odczytajPrzypisania("trener", "nowak")).toEqual(["genai", "ai-agents", "python"]);

    // akcja wyłącznie na stronie trenera
    await zapiszPrzypisania("trener", "nowak", ["ai-agents", "python", "genai"]);

    // strona trenera przestawiona…
    expect(await odczytajPrzypisania("trener", "nowak")).toEqual(["ai-agents", "python", "genai"]);
    // …a strona szkolenia NIETKNIĘTA (pod mutacją A1 klobrowanie dałoby ["krol","nowak"]).
    expect(await odczytajPrzypisania("szkolenie", "genai")).toEqual(["nowak", "krol"]);
  });

  it("przestawienie trenerów przy szkoleniu nie zmienia kolejności szkoleń trenera", async () => {
    expect(await odczytajPrzypisania("szkolenie", "genai")).toEqual(["nowak", "krol"]);
    expect(await odczytajPrzypisania("trener", "nowak")).toEqual(["genai", "ai-agents", "python"]);

    // akcja wyłącznie na stronie szkolenia
    await zapiszPrzypisania("szkolenie", "genai", ["krol", "nowak"]);

    expect(await odczytajPrzypisania("szkolenie", "genai")).toEqual(["krol", "nowak"]);
    // strona trenera NIETKNIĘTA (pod mutacją A1 klobrowanie zepsułoby tę kolejność).
    expect(await odczytajPrzypisania("trener", "nowak")).toEqual(["genai", "ai-agents", "python"]);
  });

  it("renumeracja jest bezwarunkowa: niezwarte wartości wejściowe zostają zwarte 0-based (R7)", async () => {
    // Dane z „ręcznej" wstawki: niezwarte sort_order_szkolenie, ta sama kolejność logiczna.
    ustawAtrape(
      utworzAtrape({
        szkolenie_trener: [
          { szkolenie_id: "genai", trener_id: "nowak", sort_order_trener: 0, sort_order_szkolenie: 3 },
          { szkolenie_id: "ai-agents", trener_id: "nowak", sort_order_trener: 0, sort_order_szkolenie: 9 },
        ],
      }),
    );
    // Zapis bez zmiany przynależności i bez zmiany kolejności logicznej…
    await zapiszPrzypisania("trener", "nowak", ["genai", "ai-agents"]);
    const wiersze = (biezacaAtrapa().dane["szkolenie_trener"] ?? []) as Array<Record<string, unknown>>;
    const poId = Object.fromEntries(
      wiersze.map((w) => [String(w["szkolenie_id"]), w["sort_order_szkolenie"]]),
    );
    // …i tak renumeruje do zwartego 0-based (było 3 i 9).
    expect(poId).toEqual({ genai: 0, "ai-agents": 1 });
  });
});

describe("R1 widoki publiczne (adapter) — dwie niezależne kolejności", () => {
  beforeEach(() =>
    ustawAtrape(
      utworzAtrape({
        szkolenia: [wierszSzkolenia({ id: "genai" }), wierszSzkolenia({ id: "ai-agents" })],
        trenerzy: [wierszTrenera({ id: "nowak" }), wierszTrenera({ id: "krol" })],
        szkolenie_trener: [
          // Kolejność trenerów przy genai (sort_order_trener) jest JAWNIE inna niż
          // kolejność szkoleń nowaka (sort_order_szkolenie), żeby pomylenie kolumn było widoczne.
          { szkolenie_id: "genai", trener_id: "nowak", sort_order_trener: 0, sort_order_szkolenie: 1 },
          { szkolenie_id: "genai", trener_id: "krol", sort_order_trener: 1, sort_order_szkolenie: 0 },
          { szkolenie_id: "ai-agents", trener_id: "nowak", sort_order_trener: 5, sort_order_szkolenie: 0 },
        ],
      }),
    ),
  );

  it("trenerzySzkolenia porządkuje po sort_order_trener (mutacja A3 dałaby [krol, nowak])", async () => {
    expect((await trenerzySzkolenia("genai")).map((t) => t.id)).toEqual(["nowak", "krol"]);
  });

  it("szkoleniaTrenera porządkuje po sort_order_szkolenie (mutacja A2 dałaby [genai, ai-agents])", async () => {
    expect((await szkoleniaTrenera("nowak")).map((s) => s.id)).toEqual(["ai-agents", "genai"]);
  });
});
