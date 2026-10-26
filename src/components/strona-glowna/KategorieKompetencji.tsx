import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { NaglowekSekcji } from "./NaglowekSekcji";
import { KATEGORIE_KOMPETENCJI } from "./tresci";

/** Lists the five training areas, each linking to the filtered catalog. */
export function KategorieKompetencji() {
  return (
    <section
      id="obszary"
      aria-labelledby="obszary-naglowek"
      className="scroll-mt-[calc(var(--space-16)+var(--space-6))] bg-[var(--surface-muted)] py-[var(--section-pad-y)]"
    >
      <div className="mx-auto max-w-[var(--container-max)] space-y-10 px-[var(--container-pad)]">
        <NaglowekSekcji
          id="obszary-naglowek"
          wysrodkowany
          eyebrow="Obszary szkoleń"
          naglowek="Kompetencje, które budują przewagę"
          wsparcie="Pięć obszarów szkoleniowych dla osób indywidualnych i zespołów — od sztucznej inteligencji po język angielski."
        />
        <div className="grid gap-[var(--space-6)] sm:grid-cols-2 lg:grid-cols-3">
          {KATEGORIE_KOMPETENCJI.map(({ kategoria, ikona: Ikona, tytul, opis }) => (
            <Link
              key={kategoria}
              to="/szkolenia"
              search={{ kategoria }}
              className="flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-sm)] transition duration-[var(--dur-base)] ease-standard hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] motion-reduce:transform-none"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-md bg-[var(--green-50)] text-primary">
                <Ikona aria-hidden="true" />
              </span>
              <h3 className="text-[1.15rem] font-bold tracking-[var(--ls-tight)]">{tytul}</h3>
              <p className="text-[14.5px] text-muted-foreground">{opis}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-[14.5px] font-semibold text-primary">
                Zobacz szkolenia <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
