import { pobierzKlienta, stanKonfiguracji, type StanKonfiguracji } from "./klient";

/**
 * Wspólna warstwa odczytów publicznych. Widoki gościa nigdy nie pokazują treści wyjątku,
 * więc każdy błąd bazy zamieniamy tutaj na komunikat po polsku, a surowy zapis idzie
 * wyłącznie do konsoli.
 */
export class BladOdczytu extends Error {
  override readonly name = "BladOdczytu";
}

/** Jedyny status treści widocznej publicznie. Szkic nie opuszcza panelu. */
export const STATUS_OPUBLIKOWANY = "published";

/** Zamienia surowy błąd bazy na komunikat bezpieczny do pokazania gościowi. */
export function bladOdczytu(blad: unknown, komunikat: string): BladOdczytu {
  console.error(blad);
  return blad instanceof BladOdczytu ? blad : new BladOdczytu(komunikat);
}

/**
 * Klient do odczytów publicznych. Brak konfiguracji jest zgłaszany jako błąd, a nie
 * ukrywany pustą listą — pusta oferta i brak połączenia to dwa różne stany.
 */
export function klientOdczytu(): ReturnType<typeof pobierzKlienta> {
  const stan: StanKonfiguracji = stanKonfiguracji();
  if (!stan.ok) throw new BladOdczytu(stan.powod);
  return pobierzKlienta();
}

/**
 * Układa encje w kolejności identyfikatorów z tabeli relacji. Zapytanie `in (...)` nie
 * obiecuje kolejności, więc bez tego kroku `sort_order` przypisań nic by nie znaczył.
 */
export function wKolejnosci<T extends { id: string }>(encje: T[], idWKolejnosci: string[]): T[] {
  const poId = new Map(encje.map((e) => [e.id, e]));
  return idWKolejnosci.flatMap((id) => {
    const encja = poId.get(id);
    return encja ? [encja] : [];
  });
}
