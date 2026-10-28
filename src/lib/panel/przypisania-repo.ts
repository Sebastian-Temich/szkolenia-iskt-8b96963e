import { pobierzKlienta } from "@/lib/supabase/klient";
import { mapujBlad } from "./bledy";

const TABELA = "szkolenie_trener";

/** Strona relacji: dla szkolenia czytamy trenerów, dla trenera szkolenia. */
export type StronaPrzypisania = "szkolenie" | "trener";

type WierszPrzypisania = {
  szkolenie_id: string;
  trener_id: string;
  sort_order_trener: number;
  sort_order_szkolenie: number;
};

/**
 * Kolumny danej strony:
 *  • `wlasna`     — klucz filtrowanej encji,
 *  • `obca`       — identyfikator po drugiej stronie (zarazem rozstrzygnięcie remisu),
 *  • `kolejnosc`  — kolumna porządkująca, której właścicielem zapisu jest TA strona.
 * Strona "szkolenie" porządkuje trenerów (`sort_order_trener`), strona "trener"
 * porządkuje szkolenia (`sort_order_szkolenie`). Żadna strona nie pisze do kolumny drugiej.
 */
function kolumny(strona: StronaPrzypisania) {
  return strona === "szkolenie"
    ? ({ wlasna: "szkolenie_id", obca: "trener_id", kolejnosc: "sort_order_trener" } as const)
    : ({ wlasna: "trener_id", obca: "szkolenie_id", kolejnosc: "sort_order_szkolenie" } as const);
}

/** Uporządkowana lista identyfikatorów po drugiej stronie relacji. */
export async function odczytajPrzypisania(
  strona: StronaPrzypisania,
  id: string,
): Promise<string[]> {
  const k = kolumny(strona);
  const { data, error } = await pobierzKlienta()
    .from(TABELA)
    .select("*")
    .eq(k.wlasna, id)
    .order(k.kolejnosc, { ascending: true })
    .order(k.obca, { ascending: true });
  if (error) throw mapujBlad(error, "Nie udało się wczytać przypisań.");
  const wiersze: WierszPrzypisania[] = data ?? [];
  return wiersze.map((w) => w[k.obca]);
}

/** Liczba przypisań danej encji. */
export async function liczPrzypisania(strona: StronaPrzypisania, id: string): Promise<number> {
  return (await odczytajPrzypisania(strona, id)).length;
}

/** Liczby przypisań dla wszystkich encji danej strony, po identyfikatorze. */
export async function liczbyPrzypisan(strona: StronaPrzypisania): Promise<Record<string, number>> {
  const k = kolumny(strona);
  const { data, error } = await pobierzKlienta().from(TABELA).select("*");
  if (error) throw mapujBlad(error, "Nie udało się wczytać przypisań.");
  const wiersze: WierszPrzypisania[] = data ?? [];
  const wynik: Record<string, number> = {};
  for (const w of wiersze) wynik[w[k.wlasna]] = (wynik[w[k.wlasna]] ?? 0) + 1;
  return wynik;
}

/**
 * Wyznacza różnicę przynależności między stanem obecnym a docelowym (czysta funkcja).
 * Kolejność NIE jest tu różnicowana — przepisuje ją bezwarunkowo `zapiszPrzypisania`
 * (patrz niżej), bo porównanie pozycji z indeksem nie wykrywa niezwartej numeracji (R7).
 */
export function roznicaPrzypisan(obecne: string[], docelowe: string[]) {
  return {
    dodaj: docelowe.filter((id) => !obecne.includes(id)),
    usun: obecne.filter((id) => !docelowe.includes(id)),
  };
}

/**
 * Zapisuje przypisania: przynależność różnicowo (dodaje brakujące, usuwa zdjęte),
 * a kolejność BEZWARUNKOWO. Nowe wiersze dostają pozycję z insertu; wiersze
 * pozostające są renumerowane do indeksu w `docelowe` niezależnie od zapisanej
 * wartości. To naprawia R7 u źródła (renumeracja nie zależy od porównania ze
 * stanem bazy) i jest idempotentne oraz odporne na dowolny stan wejściowy.
 * Zapis idzie wyłącznie do kolumny TEJ strony — nigdy do kolumny drugiej.
 */
export async function zapiszPrzypisania(
  strona: StronaPrzypisania,
  id: string,
  docelowe: string[],
): Promise<void> {
  const k = kolumny(strona);
  const klient = pobierzKlienta();
  const obecne = await odczytajPrzypisania(strona, id);
  const { dodaj, usun } = roznicaPrzypisan(obecne, docelowe);
  const blad = "Nie udało się zapisać przypisań.";
  if (usun.length > 0) {
    const { error } = await klient.from(TABELA).delete().eq(k.wlasna, id).in(k.obca, usun);
    if (error) throw mapujBlad(error, blad);
  }
  if (dodaj.length > 0) {
    const wiersze = dodaj.map((obcy) => ({
      [k.wlasna]: id,
      [k.obca]: obcy,
      [k.kolejnosc]: docelowe.indexOf(obcy),
    }));
    const { error } = await klient.from(TABELA).insert(wiersze);
    if (error) throw mapujBlad(error, blad);
  }
  // Wiersze pozostające: renumeracja bezwarunkowa do indeksu docelowego.
  const pozostaja = docelowe.filter((obcy) => obecne.includes(obcy));
  for (const obcy of pozostaja) {
    const { error } = await klient
      .from(TABELA)
      .update({ [k.kolejnosc]: docelowe.indexOf(obcy) })
      .eq(k.wlasna, id)
      .eq(k.obca, obcy);
    if (error) throw mapujBlad(error, blad);
  }
}
