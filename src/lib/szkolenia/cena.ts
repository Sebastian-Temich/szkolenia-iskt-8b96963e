export const UDZIAL_WLASNY = 0.2;
export const TEKST_DOFINANSOWANIA = "z dofinansowaniem";
export const NOTA_CENY = "za osobę · dofinansowanie do 80%";

/**
 * Formatuje kwotę PLN z separatorem tysięcy U+202F i spacją nierozdzielającą U+00A0
 * przed symbolem waluty, żeby kwota nie łamała się od „zł" w wąskiej karcie.
 */
export function formatujKwote(kwota: number): string {
  return `${String(kwota).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F")}\u00A0zł`;
}
/** Wylicza zaokrąglony udział własny klienta. */
export function cenaZDofinansowaniem(pelnaCena: number): number {
  return Math.round(pelnaCena * UDZIAL_WLASNY);
}
/** Formatuje cenę główną po dofinansowaniu. */
export function etykietaCenyGlownej(pelnaCena: number): string {
  return formatujKwote(cenaZDofinansowaniem(pelnaCena));
}
/** Formatuje pełną cenę z objaśnieniem. */
export function etykietaCenyPelnej(pelnaCena: number): string {
  return `${formatujKwote(pelnaCena)} bez dofinansowania`;
}
