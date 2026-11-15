import type { Zgloszenie, Zrodlo } from "./schemat";

/** Przedrostek tematu według miejsca formularza (R4). */
export const PRZEDROSTKI: Record<Zrodlo, string> = {
  kontakt: "[Kontakt]",
  zapis: "[Zapis]",
  firma: "[Firma]",
};

const RODZAJ: Record<Zgloszenie["odbiorca"], string> = {
  individual: "Osoba indywidualna",
  company: "Firma",
};

export type Email = { subject: string; text: string; html: string };

/** Znaki sterujące i separatory linii (zapisane jako escape, nie dosłownie). */
// eslint-disable-next-line no-control-regex -- celowo: usuwamy znaki sterujące z tematu (W-12/K7)
const ZNAKI_STERUJACE = new RegExp("[\\u0000-\\u001f\\u007f\\u2028\\u2029]+", "g");

/** Znaki sterujące (w tym nowe linie) zamienione na spację: temat bez wstrzyknięcia nagłówków. */
function jednaLinia(tekst: string): string {
  return tekst.replace(ZNAKI_STERUJACE, " ").replace(/ {2,}/g, " ").trim();
}

/** Escapowanie HTML treści e-maila (W-12/K7). */
export function escapujHtml(tekst: string): string {
  return tekst
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Data i godzina wysyłki w czasie polskim (R5). */
export function czasPolski(teraz: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    dateStyle: "long",
    timeStyle: "short",
  }).format(teraz);
}

/**
 * Temat według R4: „[Zapis] SZKOLENIE – IMIĘ”, „[Firma] SZKOLENIE – IMIĘ” (bez szkolenia: obszar),
 * „[Kontakt] OBSZAR – IMIĘ”. Bez znaków nowej linii.
 */
export function temat(dane: Zgloszenie): string {
  const przedmiot = dane.zrodlo === "kontakt" ? dane.obszar : (dane.szkolenieTytul ?? dane.obszar);
  return jednaLinia(`${PRZEDROSTKI[dane.zrodlo]} ${przedmiot} – ${dane.imie}`);
}

/** Buduje e-mail do biura: temat R4, treść ze wszystkimi polami (R5), tekst i HTML. */
export function zbudujEmail(dane: Zgloszenie, teraz: Date): Email {
  const wiersze: [string, string][] = [
    ["Rodzaj", RODZAJ[dane.odbiorca]],
    ["Imię i nazwisko", dane.imie],
    ["E-mail", dane.email],
    ["Telefon", dane.telefon],
  ];
  if (dane.szkolenieTytul) wiersze.push(["Szkolenie", dane.szkolenieTytul]);
  wiersze.push(
    ["Interesujące szkolenie / obszar", dane.obszar],
    ["Wiadomość", dane.wiadomosc],
    ["Zgoda na kontakt", dane.zgoda ? "tak" : "nie"],
    ["Strona", dane.strona],
    ["Wysłano", czasPolski(teraz)],
  );

  const text = wiersze.map(([etykieta, wartosc]) => `${etykieta}: ${wartosc}`).join("\n");
  const html = [
    "<table>",
    ...wiersze.map(
      ([etykieta, wartosc]) =>
        `<tr><th align="left" valign="top">${escapujHtml(etykieta)}</th><td>${escapujHtml(wartosc).replaceAll("\n", "<br>")}</td></tr>`,
    ),
    "</table>",
  ].join("");

  return { subject: temat(dane), text, html };
}
