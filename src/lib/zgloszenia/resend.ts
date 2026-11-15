import type { Email } from "./email";

/** Adres API Resend (ADR-004 pkt 2): stały w kodzie, bez SDK. */
export const ADRES_RESEND = "https://api.resend.com/emails";
/** Limit czasu odpowiedzi Resend (W-12, „Przypadki brzegowe”). */
export const LIMIT_CZASU_MS = 10_000;

export type Konfiguracja = {
  kluczResend: string;
  odbiorca: string;
  nadawca: string;
  naglowekIp: string | undefined;
};

export type WynikResend =
  { ok: true; id: string | undefined } | { ok: false; status: number | "timeout" | "siec" };

/**
 * Wysyła e-mail przez API Resend. Odpowiedź inna niż 2xx, przekroczenie 10 s albo błąd sieci
 * dają wynik błędu (stan „Błąd po naszej stronie”, kod 502).
 */
export async function wyslijPrzezResend(
  fetchImpl: typeof fetch,
  konfiguracja: Konfiguracja,
  email: Email & { replyTo: string },
  limitCzasuMs: number = LIMIT_CZASU_MS,
): Promise<WynikResend> {
  let odpowiedz: Response;
  try {
    odpowiedz = await fetchImpl(ADRES_RESEND, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${konfiguracja.kluczResend}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: konfiguracja.nadawca,
        to: [konfiguracja.odbiorca],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
      signal: AbortSignal.timeout(limitCzasuMs),
    });
  } catch (blad) {
    const nazwa = blad instanceof Error ? blad.name : "";
    return {
      ok: false,
      status: nazwa === "TimeoutError" || nazwa === "AbortError" ? "timeout" : "siec",
    };
  }
  if (!odpowiedz.ok) return { ok: false, status: odpowiedz.status };
  let id: string | undefined;
  try {
    const tresc = (await odpowiedz.json()) as { id?: unknown };
    id = typeof tresc.id === "string" ? tresc.id : undefined;
  } catch {
    id = undefined;
  }
  return { ok: true, id };
}
