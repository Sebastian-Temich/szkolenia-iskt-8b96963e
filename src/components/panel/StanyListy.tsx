import { Link } from "@tanstack/react-router";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { StatusTresci } from "@/lib/panel/typy";

/** Szkielet tabeli listy w trakcie wczytywania. */
export function SzkieletListy({ etykieta }: { etykieta: string }) {
  return (
    <div aria-busy="true" aria-label={etykieta} className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Błąd wczytania listy z ponowieniem zapytania. */
export function BladListy(props: {
  tytul: string;
  opis: string;
  ponow: () => void;
  trwa: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-6 shadow-[var(--shadow-sm)]"
    >
      <h2 className="text-lg font-bold">{props.tytul}</h2>
      <p className="text-[15px] text-[var(--text-secondary)]">{props.opis}</p>
      <Button type="button" className="rounded-pill" onClick={props.ponow} disabled={props.trwa}>
        <RotateCcw aria-hidden="true" />
        Spróbuj ponownie
      </Button>
    </div>
  );
}

/** Pusta lista z zaproszeniem do dodania pierwszego wpisu. */
export function PustaLista(props: {
  tytul: string;
  opis: string;
  akcja: string;
  do: "/panel/szkolenia/nowe" | "/panel/trenerzy/nowy";
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-6 shadow-[var(--shadow-sm)]">
      <h2 className="text-lg font-bold">{props.tytul}</h2>
      <p className="text-[15px] text-[var(--text-secondary)]">{props.opis}</p>
      <Button asChild className="rounded-pill">
        <Link to={props.do}>
          <Plus aria-hidden="true" />
          {props.akcja}
        </Link>
      </Button>
    </div>
  );
}

/** Plakietka statusu publikacji; szkic jest wyraźnie wyróżniony. */
export function PlakietkaStatusu({ status }: { status: StatusTresci }) {
  return status === "published" ? (
    <Badge>Opublikowane</Badge>
  ) : (
    <Badge variant="outline" className="border-[var(--warning-500)] bg-[var(--warning-50)]">
      Szkic
    </Badge>
  );
}
