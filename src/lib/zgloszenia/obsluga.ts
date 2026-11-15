import { zbudujEmail } from "./email";
import { skrotAdresu, type Limiter } from "./limit";
import type { Log } from "./log";
import { wyslijPrzezResend, type Konfiguracja } from "./resend";
import { pulapkaWypelniona, waliduj, ZRODLA, type PoleFormularza } from "./schemat";

/** Wynik dla formularza; `status` to kod odpowiedzi HTTP z karty W-12 („Odpowiedzi i błędy”). */
export type WynikZgloszenia =
  | { wynik: "ok" }
  | { wynik: "walidacja"; pola: PoleFormularza[] }
  | { wynik: "limit" }
  | { wynik: "blad" };

export type Odpowiedz = { status: number; tresc: WynikZgloszenia };

export type Kontekst = {
  /** Konfiguracja z `process.env` albo `undefined`, gdy brakuje klucza lub adresów. */
  konfiguracja: Konfiguracja | undefined;
  fetch: typeof fetch;
  limiter: Limiter;
  log: Log;
  /** Adres klienta wyznaczony przez `adresKlienta` (nigdy z x-forwarded-for). */
  adres: string;
  teraz: () => Date;
  limitCzasuMs?: number;
};

/** Czyta konfigurację ze zmiennych serwerowych; brak którejkolwiek wymaganej daje `undefined`. */
export function czytajKonfiguracje(
  env: Record<string, string | undefined>,
): Konfiguracja | undefined {
  const kluczResend = env["RESEND_API_KEY"]?.trim();
  const odbiorca = env["ZGLOSZENIA_ODBIORCA"]?.trim();
  const nadawca = env["ZGLOSZENIA_NADAWCA"]?.trim();
  if (!kluczResend || !odbiorca || !nadawca) return undefined;
  const naglowekIp = env["ZGLOSZENIA_NAGLOWEK_IP"]?.trim() || undefined;
  return { kluczResend, odbiorca, nadawca, naglowekIp };
}

function zrodloDoLogu(dane: unknown): string | undefined {
  if (typeof dane !== "object" || dane === null) return undefined;
  const zrodlo = (dane as Record<string, unknown>)["zrodlo"];
  return typeof zrodlo === "string" && (ZRODLA as readonly string[]).includes(zrodlo)
    ? zrodlo
    : undefined;
}

/**
 * Obsługa zgłoszenia bez serwera (ADR-004 pkt 1 i 3): pułapka, walidacja, limit z adresu, limit
 * instancji, konfiguracja, wysyłka przez Resend. Niczego nie zapisuje poza licznikami limitu.
 */
export async function obsluzZgloszenie(dane: unknown, ktx: Kontekst): Promise<Odpowiedz> {
  const zrodlo = zrodloDoLogu(dane);

  if (pulapkaWypelniona(dane)) {
    ktx.log("odrzucone", { zrodlo, powod: "pulapka" });
    return { status: 200, tresc: { wynik: "ok" } };
  }

  const walidacja = waliduj(dane);
  if (!walidacja.ok) {
    ktx.log("odrzucone", {
      zrodlo,
      powod: "walidacja",
      pola: [...walidacja.pola, ...walidacja.techniczne],
    });
    return { status: 400, tresc: { wynik: "walidacja", pola: walidacja.pola } };
  }

  const teraz = ktx.teraz();
  const klucz = await skrotAdresu(ktx.adres);
  if (!ktx.limiter.zglosz(klucz, teraz.getTime())) {
    ktx.log("odrzucone", { zrodlo, powod: "limit" });
    return { status: 429, tresc: { wynik: "limit" } };
  }

  if (!ktx.konfiguracja) {
    ktx.log("blad", { zrodlo, powod: "konfiguracja" });
    return { status: 503, tresc: { wynik: "blad" } };
  }

  if (!ktx.limiter.wysylka(teraz.getTime())) {
    ktx.log("odrzucone", { zrodlo, powod: "limit" });
    return { status: 429, tresc: { wynik: "limit" } };
  }

  const email = zbudujEmail(walidacja.dane, teraz);
  const wynik = await wyslijPrzezResend(
    ktx.fetch,
    ktx.konfiguracja,
    { ...email, replyTo: walidacja.dane.email },
    ktx.limitCzasuMs,
  );
  if (!wynik.ok) {
    ktx.log("blad", { zrodlo, powod: "resend", status: wynik.status });
    return { status: 502, tresc: { wynik: "blad" } };
  }
  ktx.log("wyslane", { zrodlo, id_resend: wynik.id });
  return { status: 200, tresc: { wynik: "ok" } };
}
