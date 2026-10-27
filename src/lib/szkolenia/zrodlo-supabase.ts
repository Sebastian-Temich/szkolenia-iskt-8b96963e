import { bladOdczytu, klientOdczytu, STATUS_OPUBLIKOWANY } from "@/lib/supabase/odczyt";
import type { KategoriaSzkolenia, ModulProgramu, Szkolenie } from "./typy";

export const TABELA_SZKOLENIA = "szkolenia";

/**
 * Kolumny widoku publicznego. `status` i `published_at` nie są tu wymienione celowo:
 * widok gościa ich nie pokazuje, więc nie opuszczają bazy.
 */
export const KOLUMNY_SZKOLENIA =
  "id,cat,icon,title,level,hours,format,price,badge,fundable,opis,learn,program,for_whom,terms";

/** Wiersz tabeli `public.szkolenia` w zakresie czytanym publicznie. */
export type WierszSzkolenia = {
  id: string;
  cat: KategoriaSzkolenia;
  icon: Szkolenie["icon"];
  title: string;
  level: string;
  hours: string;
  format: string;
  price: number;
  badge: string | null;
  fundable: boolean;
  opis: string;
  learn: string[];
  program: ModulProgramu[];
  for_whom: string;
  terms: string[] | null;
};

const KOMUNIKAT_LISTY = "Nie udało się wczytać oferty szkoleń.";
const KOMUNIKAT_SZCZEGOLU = "Nie udało się wczytać szkolenia.";

/**
 * Przepisuje wiersz bazy na model widoku. `opis` wraca jako `desc`, a `terms: null`
 * pomija klucz, żeby zadziałał fallback na terminy domyślne; `terms: []` zostaje pustą
 * listą, czyli „brak terminów". Rozróżnienie jest częścią kontraktu danych E02/B.
 */
export function wierszNaSzkolenie(w: WierszSzkolenia): Szkolenie {
  return {
    id: w.id,
    cat: w.cat,
    icon: w.icon,
    title: w.title,
    level: w.level,
    hours: w.hours,
    format: w.format,
    price: w.price,
    badge: w.badge,
    fundable: w.fundable,
    desc: w.opis,
    learn: [...w.learn],
    program: w.program.map((m) => ({ n: m.n, t: m.t })),
    forWhom: w.for_whom,
    ...(w.terms ? { terms: [...w.terms] } : {}),
  };
}

/** Opublikowana oferta w kolejności `sort_order`. */
export async function opublikowaneSzkolenia(): Promise<Szkolenie[]> {
  const { data, error } = await klientOdczytu()
    .from(TABELA_SZKOLENIA)
    .select(KOLUMNY_SZKOLENIA)
    .eq("status", STATUS_OPUBLIKOWANY)
    .order("sort_order", { ascending: true });
  if (error) throw bladOdczytu(error, KOMUNIKAT_LISTY);
  return ((data ?? []) as WierszSzkolenia[]).map(wierszNaSzkolenie);
}

/**
 * Jedno opublikowane szkolenie albo `null`. Warunek statusu jest w zapytaniu, więc szkic
 * pod znanym adresem jest nie do odróżnienia od adresu nieistniejącego.
 */
export async function opublikowaneSzkolenie(id: string): Promise<Szkolenie | null> {
  const { data, error } = await klientOdczytu()
    .from(TABELA_SZKOLENIA)
    .select(KOLUMNY_SZKOLENIA)
    .eq("id", id)
    .eq("status", STATUS_OPUBLIKOWANY)
    .maybeSingle();
  if (error) throw bladOdczytu(error, KOMUNIKAT_SZCZEGOLU);
  return data ? wierszNaSzkolenie(data as WierszSzkolenia) : null;
}

/** Opublikowane szkolenia o podanych identyfikatorach, bez narzucania kolejności. */
export async function opublikowaneSzkoleniaPoId(id: string[]): Promise<Szkolenie[]> {
  if (!id.length) return [];
  const { data, error } = await klientOdczytu()
    .from(TABELA_SZKOLENIA)
    .select(KOLUMNY_SZKOLENIA)
    .in("id", id)
    .eq("status", STATUS_OPUBLIKOWANY);
  if (error) throw bladOdczytu(error, KOMUNIKAT_LISTY);
  return ((data ?? []) as WierszSzkolenia[]).map(wierszNaSzkolenie);
}
