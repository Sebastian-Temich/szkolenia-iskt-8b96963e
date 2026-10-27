import type { StatusTresci } from "@/lib/panel/typy";
import { KLASY_INPUT } from "./pola"; // @@

/** Wybór statusu na liście. */
export type FiltrStatusu = StatusTresci | "wszystkie";

/** Filtr statusu i wyszukiwarka listy. */
export function FiltryListy(props: {
  prefiks: string;
  status: FiltrStatusu;
  fraza: string;
  onStatus: (s: FiltrStatusu) => void;
  onFraza: (f: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${props.prefiks}-status`} className="text-[13.5px] font-semibold">
          Status
        </label>
        <select
          id={`${props.prefiks}-status`}
          className={`${KLASY_INPUT} sm:w-48`}
          value={props.status}
          onChange={(e) => {
            const v = e.target.value;
            props.onStatus(v === "draft" || v === "published" ? v : "wszystkie");
          }}
        >
          <option value="wszystkie">Wszystkie</option>
          <option value="published">Opublikowane</option>
          <option value="draft">Szkice</option>
        </select>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor={`${props.prefiks}-fraza`} className="text-[13.5px] font-semibold">
          Szukaj
        </label>
        <input
          id={`${props.prefiks}-fraza`}
          type="search"
          className={KLASY_INPUT}
          value={props.fraza}
          onChange={(e) => props.onFraza(e.target.value)}
        />
      </div>
    </div>
  );
}
