import type { FiltrPanelu } from "@/lib/panel/typy";
import type { StronaPrzypisania } from "@/lib/panel/przypisania-repo";

/** Klucze zapytań panelu; wszystkie zaczynają się od „panel”, by wylogowanie czyściło całość. */
export const KLUCZE = {
  wszystko: ["panel"] as const,
  szkolenia: (filtr: FiltrPanelu = {}) => ["panel", "szkolenia", filtr] as const,
  szkolenie: (id: string) => ["panel", "szkolenie", id] as const,
  trenerzy: (filtr: FiltrPanelu = {}) => ["panel", "trenerzy", filtr] as const,
  trener: (id: string) => ["panel", "trener", id] as const,
  liczby: (strona: StronaPrzypisania) => ["panel", "liczby", strona] as const,
  przypisania: (strona: StronaPrzypisania, id: string) =>
    ["panel", "przypisania", strona, id] as const,
};
