import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Check, GraduationCap, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SCIEZKI } from "./tresci";

const CTA =
  "h-11 self-start rounded-pill border-[1.5px] border-primary px-[18px] text-[15px] font-semibold text-primary hover:bg-[var(--green-50)]";

/** Renderuje kartę jednej ścieżki odbiorcy. */
function Karta({
  ikona: Ikona,
  tresc,
  link,
}: {
  ikona: LucideIcon;
  tresc: (typeof SCIEZKI)["firmowa"];
  link: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-8)] shadow-[var(--shadow-sm)]">
      <span className="inline-flex size-[54px] items-center justify-center rounded-md bg-[var(--green-50)] text-primary">
        <Ikona aria-hidden="true" />
      </span>
      <h3 className="text-[1.35rem] font-bold tracking-[var(--ls-tight)]">{tresc.tytul}</h3>
      <p className="text-[15px] text-muted-foreground">{tresc.opis}</p>
      <ul className="flex list-none flex-col gap-2">
        {tresc.punkty.map((p) => (
          <li
            key={p}
            className="inline-flex items-center gap-2 text-[14.5px] text-[var(--ink-800)]"
          >
            <Check className="size-4 shrink-0 text-[var(--green-600)]" aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" className={CTA}>
        {link}
      </Button>
    </div>
  );
}

/** Pokazuje obie ścieżki niezależnie od wybranego odbiorcy. */
export function SciezkiOdbiorcy() {
  return (
    <section aria-label="Ścieżki szkoleń" className="pb-[var(--section-pad-y)]">
      <div className="mx-auto grid max-w-[960px] gap-[var(--space-6)] px-[var(--container-pad)] md:grid-cols-2">
        <Karta
          ikona={GraduationCap}
          tresc={SCIEZKI.indywidualna}
          link={
            <Link to="/szkolenia">
              {SCIEZKI.indywidualna.cta} <ArrowRight aria-hidden="true" />
            </Link>
          }
        />
        <Karta
          ikona={Building2}
          tresc={SCIEZKI.firmowa}
          link={
            <Link to="/" hash="kontakt">
              {SCIEZKI.firmowa.cta} <ArrowRight aria-hidden="true" />
            </Link>
          }
        />
      </div>
    </section>
  );
}
