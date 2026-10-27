import { pobierzKlienta } from "@/lib/supabase/klient";
import { mapujBlad } from "./bledy";
import { trenerNaWiersz, wierszNaTrenera } from "./mapowanie";
import type { FiltrPanelu, TrenerPanel, TrenerWiersz } from "./typy";

const TABELA = "trenerzy";

function pasuje(t: TrenerPanel, fraza: string): boolean {
  const f = fraza.trim().toLocaleLowerCase("pl-PL");
  if (!f) return true;
  return [t.id, t.name, t.role].some((p) => p.toLocaleLowerCase("pl-PL").includes(f));
}

/** Lista trenerów z filtrem statusu i frazą, w kolejności sort_order. */
export async function listaTrenerow(filtr: FiltrPanelu = {}): Promise<TrenerPanel[]> {
  let zapytanie = pobierzKlienta().from(TABELA).select("*");
  if (filtr.status && filtr.status !== "wszystkie") zapytanie = zapytanie.eq("status", filtr.status);
  const { data, error } = await zapytanie.order("sort_order", { ascending: true });
  if (error) throw mapujBlad(error, "Nie udało się wczytać listy trenerów.");
  const wiersze: TrenerWiersz[] = data ?? [];
  return wiersze.map(wierszNaTrenera).filter((t) => pasuje(t, filtr.fraza ?? ""));
}

/** Jeden trener albo null. */
export async function pobierzTrenera(id: string): Promise<TrenerPanel | null> {
  const { data, error } = await pobierzKlienta().from(TABELA).select("*").eq("id", id).maybeSingle();
  if (error) throw mapujBlad(error, "Nie udało się wczytać trenera.");
  const wiersz: TrenerWiersz | null = data;
  return wiersz ? wierszNaTrenera(wiersz) : null;
}

/** Tworzy trenera. */
export async function utworzTrenera(t: TrenerPanel): Promise<void> {
  const { error } = await pobierzKlienta().from(TABELA).insert(trenerNaWiersz(t));
  if (error) throw mapujBlad(error, "Nie udało się zapisać trenera.");
}

/** Aktualizuje treść trenera; identyfikator i status zostają bez zmian. */
export async function aktualizujTrenera(t: TrenerPanel): Promise<void> {
  const { id, status, published_at, ...pola } = trenerNaWiersz(t);
  const { error } = await pobierzKlienta().from(TABELA).update(pola).eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się zapisać trenera.");
}

/** Publikuje trenera z bieżącym czasem publikacji. */
export async function publikujTrenera(id: string): Promise<void> {
  const { error } = await pobierzKlienta()
    .from(TABELA)
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się opublikować trenera.");
}

/** Wycofuje trenera do szkicu. */
export async function wycofajTrenera(id: string): Promise<void> {
  const { error } = await pobierzKlienta().from(TABELA).update({ status: "draft" }).eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się wycofać trenera.");
}

/** Usuwa trenera na stałe. */
export async function usunTrenera(id: string): Promise<void> {
  const { error } = await pobierzKlienta().from(TABELA).delete().eq("id", id);
  if (error) throw mapujBlad(error, "Nie udało się usunąć trenera.");
}
