import { KATEGORIE_SZKOLEN, type KategoriaSzkolenia } from "@/lib/szkolenia/adapter";

/** Filtry katalogu przenoszone do szczegółu i z powrotem, żeby powrót nie gubił wyniku. */
export type PowrotDoKatalogu = { kategoria?: KategoriaSzkolenia; q?: string };

/** Zostawia tylko wartości inne niż domyślne, żeby adres nie puchł o puste filtry. */
export function filtryPowrotu(
  kategoria: KategoriaSzkolenia | "Wszystkie",
  q: string,
): PowrotDoKatalogu {
  return {
    ...(kategoria !== "Wszystkie" ? { kategoria } : {}),
    ...(q ? { q } : {}),
  };
}

/**
 * Rozpoznaje kategorię z niezaufanego adresu. Surowe `?kategoria=B+R` dekoduje się do
 * „B R", a ręcznie wpisywany bywa wariant „B-R" — oba aliasy wracają do „B+R".
 */
export function rozpoznajKategorie(wartosc: unknown): KategoriaSzkolenia | undefined {
  if (typeof wartosc !== "string") return undefined;
  const znormalizowana = wartosc === "B R" || wartosc === "B-R" ? "B+R" : wartosc;
  return KATEGORIE_SZKOLEN.find((pozycja) => pozycja === znormalizowana);
}

/** Czyta filtry powrotu z niezaufanych parametrów adresu szczegółu. */
export function czytajFiltryPowrotu(search: {
  kategoria?: unknown;
  q?: unknown;
}): PowrotDoKatalogu {
  const kategoria = rozpoznajKategorie(search.kategoria);
  const q = typeof search.q === "string" && search.q ? search.q : undefined;
  return { ...(kategoria ? { kategoria } : {}), ...(q ? { q } : {}) };
}
