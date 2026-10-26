import { cn } from "@/lib/utils";
import type { Odbiorca } from "./tresci";

type Props = {
  wartosc: Odbiorca;
  onZmiana: (odbiorca: Odbiorca) => void;
  etykiety?: Record<Odbiorca, string>;
};

const DOMYSLNE: Record<Odbiorca, string> = { individual: "Dla Ciebie", company: "Dla firm" };
const OPCJE: Odbiorca[] = ["individual", "company"];

/** Switches the page audience between individuals and companies. */
export function PrzelacznikOdbiorcy({ wartosc, onZmiana, etykiety = DOMYSLNE }: Props) {
  return (
    <div
      role="group"
      aria-label="Wybierz odbiorcę"
      className="inline-flex self-center rounded-pill border border-[var(--border-subtle)] bg-[var(--neutral-100)] p-1"
    >
      {OPCJE.map((opcja) => {
        const czyAktywny = opcja === wartosc;
        return (
          <button
            key={opcja}
            type="button"
            aria-pressed={czyAktywny}
            onClick={() => onZmiana(opcja)}
            className={cn(
              "h-9 rounded-pill px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]",
              czyAktywny
                ? "bg-card text-foreground shadow-[var(--shadow-xs)]"
                : "text-muted-foreground",
            )}
          >
            {etykiety[opcja]}
          </button>
        );
      })}
    </div>
  );
}
