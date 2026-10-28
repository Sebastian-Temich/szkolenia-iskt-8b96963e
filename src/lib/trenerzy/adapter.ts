import {
  bladOdczytu,
  klientOdczytu,
  STATUS_OPUBLIKOWANY,
  wKolejnosci,
} from "@/lib/supabase/odczyt";
import { opublikowaneSzkoleniaPoId } from "@/lib/szkolenia/zrodlo-supabase";
import type { KategoriaSzkolenia, Szkolenie } from "@/lib/szkolenia/typy";
import type { DoswiadczenieTrenera, Trener, WyksztalcenieTrenera } from "./typy";
export type { DoswiadczenieTrenera, Trener, WyksztalcenieTrenera } from "./typy";

export const TABELA_TRENERZY = "trenerzy";
export const TABELA_PRZYPISAN = "szkolenie_trener";

/** Kolumny widoku publicznego; `status` i `published_at` nie opuszczają bazy. */
export const KOLUMNY_TRENERA =
  "id,name,initials,role,areas,tagline,bio,experience,education,skills,photo_url";

/** Wiersz tabeli `public.trenerzy` w zakresie czytanym publicznie. */
export type WierszTrenera = {
  id: string;
  name: string;
  initials: string;
  role: string;
  areas: KategoriaSzkolenia[];
  tagline: string;
  bio: string;
  experience: DoswiadczenieTrenera[] | null;
  education: WyksztalcenieTrenera[] | null;
  skills: string[] | null;
  photo_url: string | null;
};

type WierszPrzypisania = { szkolenie_id: string; trener_id: string };

/**
 * Dla każdej strony odczytu: kolumna porządkująca właściwa dla tej strony oraz
 * identyfikator po drugiej stronie jako rozstrzygnięcie remisu. Filtr `trener_id`
 * (strona trenera) porządkuje szkolenia po `sort_order_szkolenie`; filtr
 * `szkolenie_id` (strona szkolenia) porządkuje trenerów po `sort_order_trener`.
 * Dwie niezależne kolejności — bez tego defekt R1 zostawałby w widokach publicznych.
 */
const PORZADEK_RELACJI = {
  trener_id: { kolejnosc: "sort_order_szkolenie", obca: "szkolenie_id" },
  szkolenie_id: { kolejnosc: "sort_order_trener", obca: "trener_id" },
} as const;

const KOMUNIKAT_LISTY = "Nie udało się wczytać listy trenerów.";
const KOMUNIKAT_PROFILU = "Nie udało się wczytać profilu trenera.";
const KOMUNIKAT_POWIAZAN = "Nie udało się wczytać powiązanych szkoleń.";
const KOMUNIKAT_PROWADZACYCH = "Nie udało się wczytać prowadzących.";

/** Przepisuje wiersz bazy na model widoku; kolumny z domyślnym `[]` mogą przyjść jako null. */
export function wierszNaTrenera(w: WierszTrenera): Trener {
  return {
    id: w.id,
    name: w.name,
    initials: w.initials,
    role: w.role,
    areas: [...w.areas],
    tagline: w.tagline,
    bio: w.bio,
    experience: (w.experience ?? []).map((e) => ({ ...e })),
    education: (w.education ?? []).map((e) => ({ ...e })),
    skills: [...(w.skills ?? [])],
    photoUrl: w.photo_url,
  };
}

/** Opublikowani trenerzy w kolejności `sort_order`. */
export async function listTrenerzy(): Promise<Trener[]> {
  const { data, error } = await klientOdczytu()
    .from(TABELA_TRENERZY)
    .select(KOLUMNY_TRENERA)
    .eq("status", STATUS_OPUBLIKOWANY)
    .order("sort_order", { ascending: true });
  if (error) throw bladOdczytu(error, KOMUNIKAT_LISTY);
  return ((data ?? []) as WierszTrenera[]).map(wierszNaTrenera);
}

/** Opublikowany profil trenera albo null — szkic i nieznane id dają ten sam wynik. */
export async function getTrener(id: string): Promise<Trener | null> {
  const { data, error } = await klientOdczytu()
    .from(TABELA_TRENERZY)
    .select(KOLUMNY_TRENERA)
    .eq("id", id)
    .eq("status", STATUS_OPUBLIKOWANY)
    .maybeSingle();
  if (error) throw bladOdczytu(error, KOMUNIKAT_PROFILU);
  return data ? wierszNaTrenera(data as WierszTrenera) : null;
}

async function przypisania(
  kolumnaFiltra: "trener_id" | "szkolenie_id",
  wartosc: string,
  komunikat: string,
): Promise<WierszPrzypisania[]> {
  const p = PORZADEK_RELACJI[kolumnaFiltra];
  const { data, error } = await klientOdczytu()
    .from(TABELA_PRZYPISAN)
    .select("szkolenie_id,trener_id")
    .eq(kolumnaFiltra, wartosc)
    .order(p.kolejnosc, { ascending: true })
    .order(p.obca, { ascending: true });
  if (error) throw bladOdczytu(error, komunikat);
  return (data ?? []) as WierszPrzypisania[];
}

/**
 * Opublikowane szkolenia prowadzone przez trenera, w kolejności `sort_order_szkolenie`.
 * Encje dociągamy drugim zapytaniem i porządkujemy po identyfikatorach, bo `in (...)`
 * nie obiecuje kolejności.
 */
export async function szkoleniaTrenera(trenerId: string): Promise<Szkolenie[]> {
  const id = (await przypisania("trener_id", trenerId, KOMUNIKAT_POWIAZAN)).map(
    (w) => w.szkolenie_id,
  );
  return wKolejnosci(await opublikowaneSzkoleniaPoId(id), id);
}

/** Opublikowani prowadzący dane szkolenie, w kolejności `sort_order_trener`. */
export async function trenerzySzkolenia(szkolenieId: string): Promise<Trener[]> {
  const id = (await przypisania("szkolenie_id", szkolenieId, KOMUNIKAT_PROWADZACYCH)).map(
    (w) => w.trener_id,
  );
  if (!id.length) return [];
  const { data, error } = await klientOdczytu()
    .from(TABELA_TRENERZY)
    .select(KOLUMNY_TRENERA)
    .in("id", id)
    .eq("status", STATUS_OPUBLIKOWANY);
  if (error) throw bladOdczytu(error, KOMUNIKAT_PROWADZACYCH);
  return wKolejnosci(((data ?? []) as WierszTrenera[]).map(wierszNaTrenera), id);
}
