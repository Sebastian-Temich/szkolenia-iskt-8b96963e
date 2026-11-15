/**
 * Limity zgłoszeń w pamięci procesu (ADR-004 pkt 4, R8). Okna przesuwne na znacznikach czasu:
 * - 5 zgłoszeń na 10 minut z jednego adresu (klucz to skrót SHA-256 adresu, nie adres);
 * - 50 wysyłek na godzinę i 80 na dobę na instancję (ochrona planu Resend: 100 e-maili dziennie).
 * Na hostingu bezserwerowym liczniki są per instancja, więc limity są przybliżone (zlecenie 6).
 */

export const LIMIT_ADRESU = { ile: 5, oknoMs: 10 * 60 * 1000 } as const;
export const LIMIT_GODZINOWY = { ile: 50, oknoMs: 60 * 60 * 1000 } as const;
export const LIMIT_DOBOWY = { ile: 80, oknoMs: 24 * 60 * 60 * 1000 } as const;

/** Klucz dla zgłoszeń bez rozpoznanego adresu: limit działa wtedy zbiorczo. */
export const ADRES_NIEZNANY = "nieznany";

export type Limiter = {
  /** Rejestruje zgłoszenie z adresu; `false`, gdy adres wyczerpał limit (zgłoszenie odrzucone). */
  zglosz(kluczAdresu: string, teraz: number): boolean;
  /** Rejestruje wysyłkę do Resend; `false`, gdy instancja wyczerpała limit godzinowy albo dobowy. */
  wysylka(teraz: number): boolean;
};

function przytnij(znaczniki: number[], teraz: number, oknoMs: number): number[] {
  return znaczniki.filter((t) => teraz - t < oknoMs);
}

export function utworzLimiter(): Limiter {
  const adresy = new Map<string, number[]>();
  let wysylki: number[] = [];
  let ostatnieSprzatanie = 0;

  const sprzatnij = (teraz: number) => {
    if (teraz - ostatnieSprzatanie < LIMIT_ADRESU.oknoMs) return;
    ostatnieSprzatanie = teraz;
    for (const [klucz, znaczniki] of adresy) {
      const aktualne = przytnij(znaczniki, teraz, LIMIT_ADRESU.oknoMs);
      if (aktualne.length === 0) adresy.delete(klucz);
      else adresy.set(klucz, aktualne);
    }
  };

  return {
    zglosz(kluczAdresu, teraz) {
      sprzatnij(teraz);
      const znaczniki = przytnij(adresy.get(kluczAdresu) ?? [], teraz, LIMIT_ADRESU.oknoMs);
      if (znaczniki.length >= LIMIT_ADRESU.ile) {
        adresy.set(kluczAdresu, znaczniki);
        return false;
      }
      znaczniki.push(teraz);
      adresy.set(kluczAdresu, znaczniki);
      return true;
    },
    wysylka(teraz) {
      wysylki = przytnij(wysylki, teraz, LIMIT_DOBOWY.oknoMs);
      const wGodzinie = wysylki.filter((t) => teraz - t < LIMIT_GODZINOWY.oknoMs).length;
      if (wGodzinie >= LIMIT_GODZINOWY.ile || wysylki.length >= LIMIT_DOBOWY.ile) return false;
      wysylki.push(teraz);
      return true;
    },
  };
}

/** Skrót SHA-256 adresu (hex): adres nie zostaje w pamięci ani w logach w jawnej postaci. */
export async function skrotAdresu(adres: string): Promise<string> {
  const bajty = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(adres));
  return [...new Uint8Array(bajty)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Adres klienta według ADR-004 pkt 4: nigdy z `x-forwarded-for`. Domyślnie adres połączenia;
 * za zaufanym proxy wyłącznie nagłówek platformy wskazany w `ZGLOSZENIA_NAGLOWEK_IP`.
 */
export function adresKlienta(opcje: {
  naglowekIp: string | undefined;
  naglowki: Headers;
  adresPolaczenia: string | undefined;
}): string {
  const nazwa = opcje.naglowekIp?.trim().toLowerCase();
  const surowy = nazwa ? opcje.naglowki.get(nazwa) : opcje.adresPolaczenia;
  const adres = surowy?.split(",")[0]?.trim();
  return adres ? adres : ADRES_NIEZNANY;
}
