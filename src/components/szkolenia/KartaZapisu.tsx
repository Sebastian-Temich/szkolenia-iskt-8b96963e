import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { terminySzkolenia, type Szkolenie } from "@/lib/szkolenia/adapter";
import { BlokCeny } from "./BlokCeny";

/** Displays the approved price and dates, with placeholder navigation for both CTAs. */
export function KartaZapisu({ szkolenie }: { szkolenie: Szkolenie }) {
  return (
    <aside className="flex min-h-[480px] flex-col gap-[var(--space-4)] rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-8)] shadow-[var(--shadow-md)] lg:sticky lg:top-[88px]">
      <BlokCeny price={szkolenie.price} wariant="szczegol" />
      <Button
        asChild
        className="h-[54px] w-full whitespace-normal rounded-pill bg-primary px-3 text-[17px] font-semibold text-primary-foreground shadow-[var(--shadow-brand)] hover:bg-[var(--green-800)]"
      >
        <Link to="/" hash="kontakt">
          Zapisz się na szkolenie <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className="h-12 w-full whitespace-normal rounded-pill border-[1.5px] border-primary px-3 text-primary hover:bg-[var(--green-50)]"
      >
        <Link to="/" hash="kontakt">
          Zapytaj o termin dla firmy
        </Link>
      </Button>
      <div className="space-y-4 border-t border-[var(--border-subtle)] pt-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-600)]">
          Najbliższe terminy
        </h2>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {terminySzkolenia(szkolenie).map((term) => (
            <li key={term} className="flex items-start gap-2">
              <Calendar className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{term}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
