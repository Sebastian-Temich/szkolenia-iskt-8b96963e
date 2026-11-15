import { createFileRoute } from "@tanstack/react-router";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { POLITYKA } from "@/lib/polityka/tresc";

export const Route = createFileRoute("/polityka-prywatnosci")({
  head: () => ({
    meta: [{ title: `${POLITYKA.tytul} — ISKT Greenovation` }],
  }),
  component: PolitykaPrywatnosci,
});

/** Strona polityki prywatności (W-13): treść z modułu `@/lib/polityka/tresc`. */
function PolitykaPrywatnosci() {
  return (
    <article
      aria-labelledby="polityka-naglowek"
      className="mx-auto max-w-[var(--container-max)] px-[var(--container-pad)] py-[var(--section-pad-y)]"
    >
      <header className="flex flex-col gap-4">
        <Eyebrow>{POLITYKA.eyebrow}</Eyebrow>
        <h1
          id="polityka-naglowek"
          className="text-[clamp(2rem,3.4vw,2.6rem)] font-extrabold leading-[1.1] tracking-[var(--ls-tight)]"
        >
          {POLITYKA.tytul}
        </h1>
        <p className="text-muted-foreground">
          Ostatnia aktualizacja:{" "}
          <time dateTime={POLITYKA.aktualizacjaIso}>{POLITYKA.aktualizacjaTekst}</time>
        </p>
      </header>
      <div className="mt-[var(--space-10)] flex max-w-[72ch] flex-col gap-[var(--space-8)]">
        {POLITYKA.sekcje.map((sekcja) => (
          <section
            key={sekcja.id}
            aria-labelledby={`polityka-${sekcja.id}`}
            className="flex flex-col gap-[var(--space-3)] [overflow-wrap:anywhere]"
          >
            <h2
              id={`polityka-${sekcja.id}`}
              className="text-xl font-bold tracking-[var(--ls-tight)]"
            >
              {sekcja.tytul}
            </h2>
            {sekcja.akapity.map((akapit) => (
              <p key={akapit} className="leading-[var(--lh-relaxed)] text-muted-foreground">
                {akapit}
              </p>
            ))}
            {sekcja.lista && (
              <ul className="flex list-disc flex-col gap-[var(--space-2)] pl-6 text-muted-foreground">
                {sekcja.lista.map((punkt) => (
                  <li key={punkt} className="leading-[var(--lh-relaxed)]">
                    {punkt}
                  </li>
                ))}
              </ul>
            )}
            {sekcja.akapityPo?.map((akapit) => (
              <p key={akapit} className="leading-[var(--lh-relaxed)] text-muted-foreground">
                {akapit}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
