import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

type Powrot = "/panel/szkolenia" | "/panel/trenerzy";

/** Nagłówek h1 widoku formularza z linkiem powrotu na listę. */
export function NaglowekStrony({ tytul, powrot }: { tytul: string; powrot: Powrot }) {
  return (
    <div className="flex flex-col gap-2">
      <Link to={powrot} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Wróć do listy
      </Link>
      <h1 className="text-3xl font-extrabold tracking-[var(--ls-tight)]">{tytul}</h1>
    </div>
  );
}

/** Widok nieistniejącego wpisu. */
export function NieZnaleziono({ tytul, powrot }: { tytul: string; powrot: Powrot }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-extrabold tracking-[var(--ls-tight)]">{tytul}</h1>
      <p className="text-[15px] text-[var(--text-secondary)]">
        Wpis mógł zostać usunięty. Wróć do listy i wybierz inny.
      </p>
      <Link to={powrot} className="self-start text-sm font-semibold text-primary underline">
        Wróć do listy
      </Link>
    </div>
  );
}
