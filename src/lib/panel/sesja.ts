import { pobierzKlienta } from "@/lib/supabase/klient";
import { BladPanelu } from "./bledy";
import { ROLE_PANELU, type RolaPanelu } from "./typy";

/** Minimalny obraz sesji potrzebny panelowi. */
export type SesjaPanelu = { email: string };

function naSesje(sesja: { user?: { email?: string | null } | null } | null): SesjaPanelu | null {
  if (!sesja) return null;
  return { email: sesja.user?.email ?? "" };
}

/** Loguje e-mailem i hasłem; przy niepowodzeniu rzuca komunikat bez treści wyjątku. */
export async function zaloguj(email: string, haslo: string): Promise<SesjaPanelu> {
  const { data, error } = await pobierzKlienta().auth.signInWithPassword({
    email,
    password: haslo,
  });
  const sesja = naSesje(data?.session ?? null);
  if (error || !sesja) {
    if (error) console.error(error);
    throw new BladPanelu("Nie udało się zalogować. Sprawdź e-mail i hasło.");
  }
  return sesja;
}

/** Wylogowuje bieżącego użytkownika. */
export async function wyloguj(): Promise<void> {
  const { error } = await pobierzKlienta().auth.signOut();
  if (error) console.error(error);
}

/** Odczytuje bieżącą sesję z przeglądarki. */
export async function biezacaSesja(): Promise<SesjaPanelu | null> {
  const { data, error } = await pobierzKlienta().auth.getSession();
  if (error) {
    console.error(error);
    return null;
  }
  return naSesje(data.session);
}

/** Nasłuchuje zmian sesji; zwraca funkcję wyłączającą nasłuch. */
export function nasluchujSesji(callback: (sesja: SesjaPanelu | null) => void): () => void {
  const { data } = pobierzKlienta().auth.onAuthStateChange((_zdarzenie, sesja) => {
    callback(naSesje(sesja));
  });
  return () => data.subscription.unsubscribe();
}

function czyRola(wartosc: unknown): wartosc is RolaPanelu {
  return typeof wartosc === "string" && (ROLE_PANELU as readonly string[]).includes(wartosc);
}

function wyciagnijRole(dane: unknown): RolaPanelu[] {
  const lista: unknown[] = Array.isArray(dane) ? dane : [dane];
  return lista
    .map((e) =>
      typeof e === "object" && e !== null ? Object.values(e as Record<string, unknown>)[0] : e,
    )
    .filter(czyRola);
}

/**
 * Odczytuje role przez RPC moje_role(), awaryjnie przez is_staff().
 * Uprawnień nigdy nie wnioskujemy z user_metadata.
 */
export async function pobierzRole(): Promise<RolaPanelu[]> {
  const klient = pobierzKlienta();
  const role = await klient.rpc("moje_role");
  if (!role.error) return wyciagnijRole(role.data);
  console.error(role.error);
  const staff = await klient.rpc("is_staff");
  if (staff.error) {
    console.error(staff.error);
    throw new BladPanelu("Nie udało się sprawdzić uprawnień.");
  }
  return staff.data === true ? ["editor"] : [];
}
