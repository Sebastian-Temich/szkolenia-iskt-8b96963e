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

// Opóźnienia i demo należą wyłącznie do warstwy mock i znikają przy jej podmianie.
const OPOZNIENIE_MOCK = 400;
const OPOZNIENIE_DEMO = 8000;
async function waitForMock(demo?: FiltrSzkolen["demo"]): Promise<void> {
  await new Promise<void>((resolve) =>
    setTimeout(resolve, demo === "ladowanie" ? OPOZNIENIE_DEMO : OPOZNIENIE_MOCK),
  );
}
/** Pobiera niezależną kopię przefiltrowanej oferty. */
export async function listSzkolenia(filtr: FiltrSzkolen = {}): Promise<Szkolenie[]> {
  await waitForMock(filtr.demo);
  if (filtr.demo === "blad") throw new Error("Nie udało się pobrać listy szkoleń");
  return structuredClone(filtrujSzkolenia(SZKOLENIA_MOCK, filtr));
}
/** Pobiera niezależną kopię szkolenia lub null. */
export async function getSzkolenie(
  id: string,
  opcje?: { demo?: FiltrSzkolen["demo"] },
): Promise<Szkolenie | null> {
  await waitForMock(opcje?.demo);
  if (opcje?.demo === "blad") throw new Error("Nie udało się pobrać szkolenia");
  const item = SZKOLENIA_MOCK.find((item) => item.id === id);
  return item ? structuredClone(item) : null;
}
/** Zwraca własne terminy albo niezależną kopię terminów domyślnych. */
export function terminySzkolenia(szkolenie: Szkolenie): string[] {
  return [...(szkolenie.terms ?? TERMINY_DOMYSLNE)];
}
