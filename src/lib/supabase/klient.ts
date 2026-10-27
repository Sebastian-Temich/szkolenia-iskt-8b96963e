import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Wynik sprawdzenia, czy przeglądarka ma komplet konfiguracji połączenia z bazą. */
export type StanKonfiguracji = { ok: true } | { ok: false; powod: string };

const POWOD_BRAKU =
  "Brak konfiguracji połączenia z bazą. Uzupełnij zmienne środowiskowe VITE_SUPABASE_URL i VITE_SUPABASE_PUBLISHABLE_KEY.";

function odczytajZmienne(): { url: string; klucz: string } | null {
  const url: unknown = import.meta.env["VITE_SUPABASE_URL"];
  const klucz: unknown = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (typeof url !== "string" || url.trim() === "") return null;
  if (typeof klucz !== "string" || klucz.trim() === "") return null;
  return { url: url.trim(), klucz: klucz.trim() };
}

/** Sprawdza konfigurację bez tworzenia klienta i bez rzucania. */
export function stanKonfiguracji(): StanKonfiguracji {
  return odczytajZmienne() ? { ok: true } : { ok: false, powod: POWOD_BRAKU };
}

let klient: SupabaseClient | null = null;

/** Zwraca leniwie tworzony klient bazy; rzuca czytelny błąd, gdy brakuje konfiguracji. */
export function pobierzKlienta(): SupabaseClient {
  if (klient) return klient;
  const zmienne = odczytajZmienne();
  if (!zmienne) throw new Error(POWOD_BRAKU);
  const wPrzegladarce = typeof window !== "undefined";
  klient = createClient(zmienne.url, zmienne.klucz, {
    auth: {
      persistSession: wPrzegladarce,
      autoRefreshToken: wPrzegladarce,
      detectSessionInUrl: false,
      ...(wPrzegladarce ? { storage: window.localStorage } : {}),
    },
  });
  return klient;
}
