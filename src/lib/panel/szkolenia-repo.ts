import { pobierzKlienta } from "@/lib/supabase/klient";
import { mapujBlad } from "./bledy";
import { szkolenieNaWiersz, wierszNaSzkolenie } from "./mapowanie";
import type { FiltrPanelu, SzkoleniePanel, SzkolenieWiersz } from "./typy";

const TABELA = "szkolenia";

/** Czy szkolenie pasuje do frazy (pl-PL, bez rozróżniania wielkości liter). */
function pasuje(s: SzkoleniePanel, fraza: string): boolean {
  const f = fraza.trim().toLocaleLowerCase("pl-PL");
  if (!f) return true;
  return [s.id, s.title, s.cat].some((p) => p.toLocaleLowerCase("pl-PL").includes(f));
}

/** Lista szkoleń z filtrem statusu i frazą, w kolejności sort_order. */
export async function listaSzkolen(filtr: FiltrPanelu = {}): Promise<SzkoleniePanel[]> {
  let zapytanie = pobierzKlienta().from(TABELA).select("*");
  if (filtr.status && filtr.status !== "wszystkie")
    zapytanie = zapytanie.eq("status", filtr.status);
  const { data, error } = await zapytanie.order("sort_order", { ascending: true });
  if (error) throw mapujBlad(error, "Nie udało się wczytać listy szkoleń.");
  const wiersze: SzkolenieWiersz[] = data ?? [];
  return wiersze.map(wierszNaSzkolenie).filter((s) => pasuje(s, filtr.fraza ?? ""));
}

/** Jedno szkolenie albo null. */
export async function pobierzSzkolenie(id: string): Promise<SzkoleniePanel | null> {
  const { data, error } = await pobierzKlienta()
    .from(TABELA)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapujBlad(error, "Nie udało się wczytać szkolenia.");
  const wiersz: SzkolenieWiersz | null = data;
  return wiersz ? wierszNaSzkolenie(wiersz) : null;
}

/** Tworzy szkolenie. */
export async function utworzSzkolenie(s: SzkoleniePanel): Promise<void> {
  const { error } = await pobierzKlienta().from(TABELA).insert(szkolenieNaWiersz(s));
  if (error) throw mapujBlad(error, "Nie udało się zapisać szkolenia.");
}

/** Aktualizuje treść szkolenia; identyfikator i status zostają bez zmian. */
export async function aktualizujSzkolenie(s: SzkoleniePanel): Promise<void> {
  const { id, status, published_at, ...pola } = szkolenieNaWiersz(s);
  const { error } = await pobierzKlienta().from(TABELA).update(pola).eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się zapisać szkolenia.");
}

/** Publikuje szkolenie z bieżącym czasem publikacji. */
export async function publikujSzkolenie(id: string): Promise<void> {
  const { error } = await pobierzKlienta()
    .from(TABELA)
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się opublikować szkolenia.");
}

/** Wycofuje szkolenie do szkicu. */
export async function wycofajSzkolenie(id: string): Promise<void> {
  const { error } = await pobierzKlienta().from(TABELA).update({ status: "draft" }).eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się wycofać szkolenia.");
}

/** Usuwa szkolenie na stałe. */
export async function usunSzkolenie(id: string): Promise<void> {
  const { error } = await pobierzKlienta().from(TABELA).delete().eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się usunąć szkolenia.");
}
