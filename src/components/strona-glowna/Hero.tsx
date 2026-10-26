import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./Eyebrow";
import { PrzelacznikOdbiorcy } from "./PrzelacznikOdbiorcy";
import { POTWIERDZENIA_HERO, trescHero, type Odbiorca } from "./tresci";

const ROZMYCIE = {
  background:
    "radial-gradient(circle, color-mix(in srgb, var(--green-700) 20%, transparent), transparent 65%)",
};

/** Renders the audience-dependent hero with the single page heading. */
export function Hero({ odbiorca, onZmiana }: { odbiorca: Odbiorca; onZmiana: (o: Odbiorca) => void }) {
  const tresc = trescHero(odbiorca);
  return (
    <section aria-labelledby="hero-naglowek" className="relative overflow-hidden py-[var(--section-pad-y)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 size-[520px]" style={ROZMYCIE} />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-20 size-[520px]" style={ROZMYCIE} />
      <div className="relative mx-auto flex max-w-[920px] flex-col items-center gap-[var(--space-6)] px-[var(--container-pad)] text-center">
        <PrzelacznikOdbiorcy wartosc={odbiorca} onZmiana={onZmiana} />
        <Eyebrow>{tresc.eyebrow}</Eyebrow>
        <h1
          id="hero-naglowek"
          className="mx-auto max-w-[16ch] text-[clamp(2.4rem,5.4vw,4rem)] font-extrabold leading-[1.05] tracking-[var(--ls-tighter)]"
        >
          {tresc.naglowek}
        </h1>
        <p className="max-w-[60ch] text-lg text-muted-foreground">{tresc.wsparcie}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            asChild
            className="h-14 rounded-pill bg-primary px-[30px] text-[18px] font-semibold text-primary-foreground shadow-[var(--shadow-brand)] hover:bg-[var(--green-800)]"
          >
            <Link to="/" hash="kontakt">
              {tresc.cta} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-14 rounded-pill border-[1.5px] border-primary px-7 text-[18px] font-semibold text-primary hover:bg-[var(--green-50)]"
          >
            <Link to="/szkolenia">Przeglądaj katalog</Link>
          </Button>
        </div>
        <ul className="flex list-none flex-wrap justify-center gap-x-6 gap-y-2">
          {POTWIERDZENIA_HERO.map((tekst) => (
            <li key={tekst} className="inline-flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-primary" aria-hidden="true" />
              {tekst}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
