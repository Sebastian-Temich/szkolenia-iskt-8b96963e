import type { ReactNode } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatusTresci } from "@/lib/panel/typy";

/** Cel dotykowy akcji na karcie (telefon): co najmniej 44×44 px (issue #39). */
const KLASA_DOTYKOWA = "min-h-11 min-w-11";

/**
 * Akcje wiersza listy: edycja (link), publikacja albo wycofanie, usunięcie. `karta` układa je
 * na karcie telefonu z celami dotykowymi ≥ 44×44 px; etykiety i nazwy dostępne bez zmian.
 */
export function AkcjeWiersza(props: {
  nazwa: string;
  status: StatusTresci;
  edytuj: ReactNode;
  trwa: boolean;
  onPrzelacz: () => void;
  onUsun: () => void;
  karta?: boolean;
}) {
  const dotyk = props.karta ? KLASA_DOTYKOWA : undefined;
  return (
    <div className={`flex flex-wrap gap-1 ${props.karta ? "justify-start" : "justify-end"}`}>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={dotyk}
        aria-label={`Edytuj: ${props.nazwa}`}
      >
        {props.edytuj}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={dotyk}
        disabled={props.trwa}
        onClick={props.onPrzelacz}
        aria-label={`${props.status === "published" ? "Wycofaj" : "Publikuj"}: ${props.nazwa}`}
      >
        {props.status === "published" ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        {props.status === "published" ? "Wycofaj" : "Publikuj"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={props.karta ? `text-destructive ${KLASA_DOTYKOWA}` : "text-destructive"}
        disabled={props.trwa}
        onClick={props.onUsun}
        aria-label={`Usuń: ${props.nazwa}`}
      >
        <Trash2 aria-hidden="true" />
        Usuń
      </Button>
    </div>
  );
}

/** Zawartość linku edycji z ikoną. */
export function TrescEdycji() {
  return (
    <>
      <Pencil aria-hidden="true" />
      Edytuj
    </>
  );
}
