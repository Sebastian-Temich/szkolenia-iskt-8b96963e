import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KLASY_INPUT } from "./pola";

/** Pozycja do wyboru: identyfikator i czytelna nazwa. */
export type OpcjaPowiazania = { id: string; etykieta: string };

/** Wybór wielu powiązań z kolejnością (trenerzy szkolenia albo szkolenia trenera). */
export function WyborPowiazan(props: {
  idPola: string;
  etykieta: string;
  opcje: OpcjaPowiazania[];
  wybrane: string[];
  onZmiana: (ids: string[]) => void;
}) {
  const [doDodania, setDoDodania] = useState("");
  const { wybrane, onZmiana } = props;
  const nazwa = (id: string) => props.opcje.find((o) => o.id === id)?.etykieta ?? id;
  const dostepne = props.opcje.filter((o) => !wybrane.includes(o.id));
  const przesun = (i: number, o: number) => {
    const kopia = [...wybrane];
    const a = kopia[i];
    const b = kopia[i + o];
    if (a === undefined || b === undefined) return;
    kopia[i] = b;
    kopia[i + o] = a;
    onZmiana(kopia);
  };
  return (
    <div className="flex flex-col gap-3">
      {wybrane.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Brak przypisań.</p>
      ) : (
        <ol className="flex flex-col gap-2" aria-label={`Wybrane: ${props.etykieta}`}>
          {wybrane.map((id, i) => (
            <li
              key={id}
              className="flex items-center justify-between gap-2 rounded-md border border-[var(--border-subtle)] px-3 py-2"
            >
              <span className="text-sm font-medium">
                {i + 1}. {nazwa(id)}
              </span>
              <span className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={i === 0}
                  aria-label={`Przesuń wyżej: ${nazwa(id)}`}
                  onClick={() => przesun(i, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={i === wybrane.length - 1}
                  aria-label={`Przesuń niżej: ${nazwa(id)}`}
                  onClick={() => przesun(i, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Usuń przypisanie: ${nazwa(id)}`}
                  onClick={() => onZmiana(wybrane.filter((w) => w !== id))}
                >
                  <X aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor={props.idPola} className="text-[13.5px] font-semibold">
            Dodaj: {props.etykieta.toLocaleLowerCase("pl-PL")}
          </label>
          <select
            id={props.idPola}
            className={KLASY_INPUT}
            value={doDodania}
            onChange={(e) => setDoDodania(e.target.value)}
          >
            <option value="">Wybierz…</option>
            {dostepne.map((o) => (
              <option key={o.id} value={o.id}>
                {o.etykieta}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!doDodania}
          onClick={() => {
            onZmiana([...wybrane, doDodania]);
            setDoDodania("");
          }}
        >
          <Plus aria-hidden="true" />
          Dodaj
        </Button>
      </div>
    </div>
  );
}
