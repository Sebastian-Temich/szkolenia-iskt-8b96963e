import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { ZRODLA_DOFINANSOWANIA } from "./tresci";

/** Prezentuje publiczne źródła finansowania na ciemnym gradiencie marki. */
export function Dofinansowania() {
  return (
    <section
      id="dofinansowania"
      aria-labelledby="dofinansowania-naglowek"
      className="scroll-mt-[calc(var(--space-16)+var(--space-6))] py-[var(--section-pad-y)]"
    >
      <div className="mx-auto max-w-[var(--container-max)] px-[var(--container-pad)]">
        <div className="relative space-y-10 overflow-hidden rounded-2xl bg-[image:var(--gradient-brand)] p-[clamp(2.5rem,5vw,4.5rem)] text-[var(--text-on-brand)] shadow-[var(--shadow-lg)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[var(--text-on-brand)]/16 blur-3xl"
          />
          <div className="relative flex max-w-[720px] flex-col gap-4">
            <Eyebrow className="text-[var(--green-200)]">Dofinansowania</Eyebrow>
            <h2
              id="dofinansowania-naglowek"
              className="text-[clamp(2rem,3.4vw,2.6rem)] font-extrabold leading-[1.1] tracking-[var(--ls-tight)] text-[var(--text-on-brand)]"
            >
              Zapłać nawet o 80% mniej
            </h2>
            <p className="text-lg text-[var(--text-on-brand)]/90">
              Większość naszych szkoleń kwalifikuje się do publicznych źródeł finansowania. Pomożemy
              Ci sprawdzić dostępne dotacje i przejść przez formalności — od wniosku po rozliczenie.
            </p>
          </div>
          <div className="relative grid gap-[var(--space-6)] md:grid-cols-3">
            {ZRODLA_DOFINANSOWANIA.map(({ skrot, ikona: Ikona, tytul, opis }) => (
              <div
                key={skrot}
                className="flex flex-col gap-3 rounded-lg border border-[var(--text-on-brand)]/16 bg-[var(--text-on-brand)]/8 p-[var(--space-6)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-md bg-[var(--text-on-brand)]/14 text-[var(--text-on-brand)]">
                    <Ikona aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[20px] font-semibold text-[var(--text-on-brand)]">
                    {skrot}
                  </span>
                </div>
                <h3 className="text-[1.05rem] font-bold text-[var(--text-on-brand)]">{tytul}</h3>
                <p className="text-[14px] text-[var(--text-on-brand)]/85">{opis}</p>
              </div>
            ))}
          </div>
          <Button
            asChild
            className="relative h-auto min-h-[54px] w-full justify-center whitespace-normal rounded-pill bg-white px-7 py-3 sm:w-auto text-[17px] font-bold text-[var(--green-800)] shadow-[var(--shadow-md)] hover:bg-[var(--green-50)]"
          >
            <Link to="/" hash="kontakt">
              Sprawdź swoje dofinansowanie <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
