import { cn } from "@/lib/utils";

// TYMCZASOWY wordmark typograficzny. NIE jest to znak marki ISKT.
// Znak ISKT (liść + motyw circuit) jest rastrem i czeka na dostarczenie
// wektora przez ISKT; wtedy podmieniasz TYLKO ten komponent.
// Nie przerysowuj znaku i nie generuj jego zamiennika graficznego.

/** Displays the temporary typographic wordmark until ISKT supplies its vector mark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center font-display text-3xl font-extrabold tracking-normal text-primary",
        className,
      )}
    >
      ISKT
    </span>
  );
}