import { Fragment, type ReactNode } from "react";

/** Pole karty: etykieta jak nagłówek kolumny tabeli i jego wartość. */
export type PoleKarty = { etykieta: string; wartosc: ReactNode; klasa?: string };

/**
 * Lista kart panelu na telefonie (< 768 px, issue #39): ta sama treść co wiersze tabeli,
 * bez przewijania w bok. Każda karta to element listy z nagłówkiem tytułu.
 */
export function ListaKart({ etykieta, children }: { etykieta: string; children: ReactNode }) {
  return (
    <ul aria-label={etykieta} className="flex min-w-0 flex-col gap-3">
      {children}
    </ul>
  );
}

/** Karta jednej pozycji: tytuł, pola z etykietami (lista opisów) i akcje wiersza. */
export function KartaPozycji(props: { tytul: string; pola: PoleKarty[]; akcje: ReactNode }) {
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-4 shadow-[var(--shadow-sm)]">
      <h2 className="text-lg font-bold break-words">{props.tytul}</h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
        {props.pola.map((p) => (
          <Fragment key={p.etykieta}>
            <dt className="text-[var(--text-secondary)]">{p.etykieta}</dt>
            <dd className={["min-w-0 break-words", p.klasa].filter(Boolean).join(" ")}>
              {p.wartosc}
            </dd>
          </Fragment>
        ))}
      </dl>
      {props.akcje}
    </li>
  );
}
