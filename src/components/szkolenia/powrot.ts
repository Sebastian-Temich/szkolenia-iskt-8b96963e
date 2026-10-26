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

/** Czyta filtry powrotu z niezaufanych parametrów adresu szczegółu. */
export function czytajFiltryPowrotu(search: {
  kategoria?: unknown;
  q?: unknown;
}): PowrotDoKatalogu {
  const kategoria = KATEGORIE_SZKOLEN.find((pozycja) => pozycja === search.kategoria);
  const q = typeof search.q === "string" && search.q ? search.q : undefined;
  return { ...(kategoria ? { kategoria } : {}), ...(q ? { q } : {}) };
}