// TODO E02: podmiana na Supabase — patrz ISK-12
import { SZKOLENIA_MOCK, TERMINY_DOMYSLNE } from "./mock-dane";
import { filtrujSzkolenia } from "./filtrowanie";
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

// Opóźnienie symuluje sieć i należy wyłącznie do warstwy mock; znika przy jej podmianie.
const OPOZNIENIE_MOCK = 400;
async function waitForMock(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, OPOZNIENIE_MOCK));
}
/** Pobiera niezależną kopię przefiltrowanej oferty. */
export async function listSzkolenia(filtr: FiltrSzkolen = {}): Promise<Szkolenie[]> {
  await waitForMock();
  return structuredClone(filtrujSzkolenia(SZKOLENIA_MOCK, filtr));
}
/** Pobiera niezależną kopię szkolenia lub null. */
export async function getSzkolenie(id: string): Promise<Szkolenie | null> {
  await waitForMock();
  const item = SZKOLENIA_MOCK.find((item) => item.id === id);
  return item ? structuredClone(item) : null;
}
/** Zwraca własne terminy albo niezależną kopię terminów domyślnych. */
export function terminySzkolenia(szkolenie: Szkolenie): string[] {
  return [...(szkolenie.terms ?? TERMINY_DOMYSLNE)];
}
