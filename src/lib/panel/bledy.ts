/** Błąd z komunikatem po polsku, bezpiecznym do pokazania redaktorowi. */
export class BladPanelu extends Error {
  override readonly name = "BladPanelu";
}

export const KOMUNIKAT_BRAK_UPRAWNIEN = "Nie masz uprawnień do tej operacji";

function pole(obiekt: unknown, klucz: string): unknown {
  return typeof obiekt === "object" && obiekt !== null
    ? (obiekt as Record<string, unknown>)[klucz]
    : undefined;
}

/** Zamienia surowy błąd bazy na komunikat po polsku; surowy błąd trafia tylko do konsoli. */
export function mapujBlad(blad: unknown, domyslny: string): BladPanelu {
  console.error(blad);
  if (blad instanceof BladPanelu) return blad;
  const kod = pole(blad, "code");
  const status = pole(blad, "status");
  const tresc = String(pole(blad, "message") ?? "").toLowerCase();
  if (kod === "42501" || status === 401 || status === 403 || tresc.includes("row-level security")) {
    return new BladPanelu(KOMUNIKAT_BRAK_UPRAWNIEN);
  }
  if (kod === "23505") {
    return new BladPanelu("Istnieje już wpis o tym identyfikatorze albo tej kolejności.");
  }
  return new BladPanelu(domyslny);
}

/** Komunikat do pokazania w UI dla dowolnego błędu. */
export function komunikatBledu(blad: unknown, domyslny: string): string {
  return blad instanceof BladPanelu ? blad.message : domyslny;
}
