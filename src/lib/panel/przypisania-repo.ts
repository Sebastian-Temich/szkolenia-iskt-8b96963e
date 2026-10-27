import { pobierzKlienta } from "@/lib/supabase/klient";
import { mapujBlad } from "./bledy";

const TABELA = "szkolenie_trener";

/** Strona relacji: dla szkolenia czytamy trenerów, dla trenera szkolenia. */
export type StronaPrzypisania = "szkolenie" | "trener";

type WierszPrzypisania = { szkolenie_id: string; trener_id: string; sort_order: number };

function kolumny(strona: StronaPrzypisania) {
  return strona === "szkolenie"
    ? ({ wlasna: "szkolenie_id", obca: "trener_id" } as const)
    : ({ wlasna: "trener_id", obca: "szkolenie_id" } as const);
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
    .order("sort_order", { ascending: true });
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

/** Wyznacza różnicę między stanem obecnym a docelowym (czysta funkcja). */
export function roznicaPrzypisan(obecne: string[], docelowe: string[]) {
  return {
    dodaj: docelowe.filter((id) => !obecne.includes(id)),
    usun: obecne.filter((id) => !docelowe.includes(id)),
    zmienKolejnosc: docelowe.filter((id, i) => obecne.includes(id) && obecne.indexOf(id) !== i),
  };
}

/** Zapisuje przypisania różnicowo: dodaje brakujące, usuwa zdjęte, poprawia kolejność. */
export async function zapiszPrzypisania(
  strona: StronaPrzypisania,
  id: string,
  docelowe: string[],
): Promise<void> {
  const k = kolumny(strona);
  const klient = pobierzKlienta();
  const obecne = await odczytajPrzypisania(strona, id);
  const { dodaj, usun, zmienKolejnosc } = roznicaPrzypisan(obecne, docelowe);
  const blad = "Nie udało się zapisać przypisań.";
  if (usun.length > 0) {
    const { error } = await klient.from(TABELA).delete().eq(k.wlasna, id).in(k.obca, usun);
    if (error) throw mapujBlad(error, blad);
  }
  if (dodaj.length > 0) {
    const wiersze = dodaj.map((obcy) => ({
      [k.wlasna]: id,
      [k.obca]: obcy,
      sort_order: docelowe.indexOf(obcy),
    }));
    const { error } = await klient.from(TABELA).insert(wiersze);
    if (error) throw mapujBlad(error, blad);
  }
  for (const obcy of zmienKolejnosc) {
    const { error } = await klient
      .from(TABELA)
      .update({ sort_order: docelowe.indexOf(obcy) })
      .eq(k.wlasna, id)
      .eq(k.obca, obcy);
    if (error) throw mapujBlad(error, blad);
  }
}
