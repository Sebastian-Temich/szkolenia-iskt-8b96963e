// Źródłem oferty jest Supabase (E02/F). Mock z `mock-dane.ts` został odcięty od widoków
// i służy już tylko jako oracle testów zgodności z makietą.
import { filtrujSzkolenia } from "./filtrowanie";
import { TERMINY_DOMYSLNE } from "./terminy";
import { opublikowaneSzkolenia, opublikowaneSzkolenie } from "./zrodlo-supabase";
import type { FiltrSzkolen, Szkolenie } from "./typy";
export { KATEGORIE_SZKOLEN } from "./typy";
export type { FiltrSzkolen, Szkolenie, KategoriaSzkolenia } from "./typy";
export { filtrujSzkolenia, opiszLiczbeWynikow } from "./filtrowanie";
export {
  UDZIAL_WLASNY,
  TEKST_DOFINANSOWANIA,
  NOTA_CENY,
  formatujKwote,
  cenaZDofinansowaniem,
  etykietaCenyGlownej,
  etykietaCenyPelnej,
} from "./cena";

/**
 * Pobiera przefiltrowaną ofertę. Filtrowanie zostaje po stronie klienta celowo:
 * `filtrujSzkolenia` to ten sam kod, który odebrano w E01 (fraza trimowana, porównanie
 * `pl-PL` na `title + cat + desc`), więc podmiana źródła nie zmienia semantyki filtrów.
 * Zbiór to kilkanaście wierszy pobieranych jednym zapytaniem w kolejności `sort_order`.
 */
export async function listSzkolenia(filtr: FiltrSzkolen = {}): Promise<Szkolenie[]> {
  return filtrujSzkolenia(await opublikowaneSzkolenia(), filtr);
}

/** Pobiera opublikowane szkolenie albo null — szkic i nieznane id dają ten sam wynik. */
export async function getSzkolenie(id: string): Promise<Szkolenie | null> {
  return opublikowaneSzkolenie(id);
}

/** Zwraca własne terminy albo niezależną kopię terminów domyślnych. */
export function terminySzkolenia(szkolenie: Szkolenie): string[] {
  return [...(szkolenie.terms ?? TERMINY_DOMYSLNE)];
}
