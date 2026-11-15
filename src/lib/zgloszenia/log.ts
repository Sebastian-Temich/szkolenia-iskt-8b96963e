import { KOLEJNOSC_POL, ZRODLA } from "./schemat";

/**
 * Logi zgłoszeń z białą listą pól (ADR-004 pkt 5, W-14): `zrodlo`, `powod`, `status`,
 * `id_resend` i nazwy błędnych pól. Wartości z formularza (imię, e-mail, telefon, treść) nie mają
 * tu wejścia: typ ich nie przyjmuje, a każda wartość jest dodatkowo sprawdzana przed zapisem.
 */

export type Zdarzenie = "wyslane" | "odrzucone" | "blad";
export type Powod = "pulapka" | "walidacja" | "limit" | "konfiguracja" | "resend";

export type PolaLogu = {
  zrodlo?: string | undefined;
  powod?: Powod;
  status?: number | string | undefined;
  id_resend?: string | undefined;
  pola?: readonly string[];
};

export type Ujscie = (linia: string) => void;

const POWODY: readonly string[] = ["pulapka", "walidacja", "limit", "konfiguracja", "resend"];
const NAZWY_POL: readonly string[] = [
  ...KOLEJNOSC_POL,
  "zrodlo",
  "odbiorca",
  "strona",
  "szkolenieTytul",
  "strona_www",
];
const ID_RESEND = /^[A-Za-z0-9-]{1,64}$/;

function bezpieczne(pola: PolaLogu): string[] {
  const czesci: string[] = [];
  if (pola.zrodlo && (ZRODLA as readonly string[]).includes(pola.zrodlo)) {
    czesci.push(`zrodlo=${pola.zrodlo}`);
  }
  if (pola.powod && POWODY.includes(pola.powod)) czesci.push(`powod=${pola.powod}`);
  if (pola.status !== undefined) {
    const status = String(pola.status);
    czesci.push(`status=${/^[0-9]{1,3}$|^timeout$|^siec$/.test(status) ? status : "inny"}`);
  }
  if (pola.id_resend && ID_RESEND.test(pola.id_resend)) czesci.push(`id_resend=${pola.id_resend}`);
  if (pola.pola?.length) {
    const nazwy = pola.pola.filter((p) => NAZWY_POL.includes(p));
    if (nazwy.length) czesci.push(`pola=${nazwy.join(",")}`);
  }
  return czesci;
}

export type Log = (zdarzenie: Zdarzenie, pola: PolaLogu) => void;

/** Logger zgłoszeń; domyślne ujście to `console.info` (logi serwera). */
export function utworzLog(ujscie: Ujscie = (linia) => console.info(linia)): Log {
  return (zdarzenie, pola) => {
    ujscie(["zgloszenie", zdarzenie, ...bezpieczne(pola)].join(" "));
  };
}
