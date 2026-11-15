import { createServerFn } from "@tanstack/react-start";
import { utworzLimiter, adresKlienta } from "./limit";
import { utworzLog } from "./log";
import { czytajKonfiguracje, obsluzZgloszenie, type WynikZgloszenia } from "./obsluga";

/**
 * Funkcja serwerowa wysyłki zgłoszenia (ADR-004 pkt 1). Cienka warstwa: czyta `process.env`,
 * adres połączenia i nagłówki żądania, a całą logikę zostawia `obsluzZgloszenie`, testowanej bez
 * serwera. Klucz i adresy czyta wyłącznie ten kod serwerowy (zmienne bez przedrostka `VITE_`).
 */

/** Liczniki limitu żyją w pamięci instancji serwera (ADR-004 pkt 4). */
const limiter = utworzLimiter();
const log = utworzLog();

/**
 * `vite dev` nie wczytuje do `process.env` zmiennych bez `VITE_` z `.env.local`; wczytujemy je
 * tylko w trybie deweloperskim i bez nadpisywania zmiennych ustawionych w środowisku.
 */
function wczytajEnvDeweloperski() {
  if (!import.meta.env.DEV || process.env["RESEND_API_KEY"]) return;
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Brak pliku: formularz pokaże stan błędu konfiguracji (503).
  }
}

export const wyslijZgloszenie = createServerFn({ method: "POST" })
  .inputValidator((dane: unknown) => dane)
  .handler(async ({ data }): Promise<WynikZgloszenia> => {
    const { getRequest, getRequestIP, setResponseStatus } =
      await import("@tanstack/react-start/server");
    wczytajEnvDeweloperski();
    const konfiguracja = czytajKonfiguracje(process.env);
    const adres = adresKlienta({
      naglowekIp: konfiguracja?.naglowekIp ?? process.env["ZGLOSZENIA_NAGLOWEK_IP"],
      naglowki: getRequest().headers,
      // Bez `xForwardedFor`: adres gniazda, nigdy nagłówek ustawiany przez klienta.
      adresPolaczenia: getRequestIP(),
    });
    const odpowiedz = await obsluzZgloszenie(data, {
      konfiguracja,
      fetch: globalThis.fetch,
      limiter,
      log,
      adres,
      teraz: () => new Date(),
    });
    setResponseStatus(odpowiedz.status);
    return odpowiedz.tresc;
  });
