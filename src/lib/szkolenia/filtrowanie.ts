import type { FiltrSzkolen, Szkolenie } from "./typy";

/** Filtruje po kategorii i frazie w title, cat i desc bez uwzględniania wielkości liter. */
export function filtrujSzkolenia(szkolenia: Szkolenie[], filtr: FiltrSzkolen = {}): Szkolenie[] {
  const query = filtr.q?.trim().toLocaleLowerCase("pl-PL") ?? "";
  return szkolenia.filter((item) =>
    (!filtr.kategoria || filtr.kategoria === "Wszystkie" || item.cat === filtr.kategoria) &&
    (!query || `${item.title} ${item.cat} ${item.desc}`.toLocaleLowerCase("pl-PL").includes(query)),
  );
}

/** Zwraca poprawną polską odmianę liczby wyników. */
export function opiszLiczbeWynikow(liczba: number): string {
  if (liczba === 1) return "1 szkolenie";
  const last = liczba % 10;
  const lastTwo = liczba % 100;
  const noun = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? "szkolenia" : "szkoleń";
  return `${liczba} ${noun}`;
}
