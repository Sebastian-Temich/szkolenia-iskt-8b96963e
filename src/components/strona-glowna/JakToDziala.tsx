import { NaglowekSekcji } from "./NaglowekSekcji";
import { krokiProcesu, type Odbiorca } from "./tresci";

/** Shows the four process steps for the selected audience. */
export function JakToDziala({ odbiorca }: { odbiorca: Odbiorca }) {
  const tresc = krokiProcesu(odbiorca);
  return (
    <section
      id="jak"
      aria-labelledby="jak-naglowek"
      className="scroll-mt-[calc(var(--space-16)+var(--space-6))] bg-[var(--surface-subtle)] py-[var(--section-pad-y)]"
    >
      <div className="mx-auto max-w-[var(--container-max)] space-y-10 px-[var(--container-pad)]">
        <NaglowekSekcji
          id="jak-naglowek"
          wysrodkowany
          eyebrow="Jak to działa"
          naglowek={tresc.naglowek}
          wsparcie={tresc.wsparcie}
        />
        <ol className="grid list-none gap-[var(--space-6)] sm:grid-cols-2 xl:grid-cols-4">
          {tresc.kroki.map(({ nr, ikona: Ikona, tytul, opis }) => (
            <li
              key={nr}
              className="flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-xs)]"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Ikona aria-hidden="true" />
                </span>
                <span className="font-mono text-[22px] font-semibold text-[var(--green-200)]">
                  {nr}
                </span>
              </div>
              <h3 className="text-[1.15rem] font-bold tracking-[var(--ls-tight)]">{tytul}</h3>
              <p className="text-[14.5px] text-muted-foreground">{opis}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
