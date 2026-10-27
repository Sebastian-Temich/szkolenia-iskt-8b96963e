import type { ReactNode } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatusTresci } from "@/lib/panel/typy";

/** Akcje wiersza listy: edycja (link), publikacja albo wycofanie, usunięcie. */
export function AkcjeWiersza(props: {
  nazwa: string;
  status: StatusTresci;
  edytuj: ReactNode;
  trwa: boolean;
  onPrzelacz: () => void;
  onUsun: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild variant="ghost" size="sm" aria-label={`Edytuj: ${props.nazwa}`}>
        {props.edytuj}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
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
        className="text-destructive"
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
