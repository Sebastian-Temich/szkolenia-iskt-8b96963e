import { createFileRoute } from "@tanstack/react-router";
import { PALETTE_GROUPS } from "@/components/foundations/palette";

const DESCRIPTION =
  "Tokeny marki ISKT Greenovation w działaniu — źródłem prawdy jest plik src/styles.css.";
const TYPE_SCALE = [
  ["--text-xs", "text-xs"],
  ["--text-sm", "text-sm"],
  ["--text-base", "text-base"],
  ["--text-lg", "text-lg"],
  ["--text-xl", "text-xl"],
  ["--text-2xl", "text-2xl"],
  ["--text-3xl", "text-3xl"],
  ["--text-4xl", "text-4xl"],
  ["--text-5xl", "text-5xl"],
  ["--text-6xl", "text-6xl"],
];
const WEIGHTS = [
  ["400", "font-normal"],
  ["500", "font-medium"],
  ["600", "font-semibold"],
  ["700", "font-bold"],
  ["800", "font-extrabold"],
];
const RADII = [
  "rounded-xs",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",
  "rounded-pill",
];
const SHADOWS = ["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg", "shadow-brand"];
const GRADIENTS = [
  ["--gradient-brand", "[background-image:var(--gradient-brand)]"],
  ["--gradient-leaf", "[background-image:var(--gradient-leaf)]"],
  ["--gradient-wash", "[background-image:var(--gradient-wash)]"],
];

export const Route = createFileRoute("/fundamenty")({
  head: () => ({
    meta: [
      { title: "Fundamenty wizualne — ISKT Greenovation" },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Foundations,
});

/** Prezentuje dostarczone tokeny marki do weryfikacji wizualnej. */
function Foundations() {
  return (
    <div className="mx-auto max-w-[var(--container-max)] space-y-16 px-[var(--container-pad)] py-[var(--section-pad-y)]">
      <div className="space-y-6">
        <p className="text-xs font-bold uppercase tracking-[var(--ls-caps)] text-primary">
          SYSTEM WIZUALNY
        </p>
        <h1 className="text-4xl font-extrabold tracking-normal md:text-5xl">Fundamenty wizualne</h1>
        <p className="max-w-[60ch] text-lg text-muted-foreground">{DESCRIPTION}</p>
      </div>
      <section aria-labelledby="palette-heading" className="space-y-8">
        <h2 id="palette-heading" className="text-3xl tracking-normal">
          Paleta
        </h2>
        {PALETTE_GROUPS.map((group) => (
          <div key={group.title} className="space-y-4">
            <h3 className="text-xl tracking-normal">{group.title}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
              {group.swatches.map((swatch) => (
                <div key={swatch.token} className="min-w-0 space-y-2">
                  <div
                    className={`h-16 rounded-md border border-border ${swatch.className}`}
                    aria-hidden="true"
                  />
                  <p className="font-mono text-xs">{swatch.token}</p>
                  <p className="font-mono text-xs text-muted-foreground">{swatch.hex}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section aria-labelledby="type-heading" className="space-y-8">
        <h2 id="type-heading" className="text-3xl tracking-normal">
          Typografia
        </h2>
        <div className="divide-y divide-border">
          {TYPE_SCALE.map(([token, utility]) => (
            <div key={token} className="grid min-w-0 gap-3 py-6 md:grid-cols-[160px_1fr]">
              <p className="font-mono text-xs text-muted-foreground">{token}</p>
              <p className={`min-w-0 [overflow-wrap:anywhere] ${utility}`}>
                Innowacje w Harmonii z Naturą
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <h3 className="text-xl tracking-normal">Krój o stałej szerokości</h3>
          <p className="font-mono text-lg">szkolenia.iskt.pl</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl tracking-normal">Grubości pisma</h3>
          {WEIGHTS.map(([weight, utility]) => (
            <div key={weight} className="flex flex-wrap items-baseline gap-6">
              <span className="font-mono text-xs text-muted-foreground">{weight}</span>
              <p className={`text-xl ${utility}`}>Innowacje w Harmonii z Naturą</p>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="effects-heading" className="space-y-8">
        <h2 id="effects-heading" className="text-3xl tracking-normal">
          Promienie i cienie
        </h2>
        <div className="space-y-4">
          <h3 className="text-xl tracking-normal">Promienie</h3>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {RADII.map((utility) => (
              <div key={utility} className="space-y-3">
                <div
                  className={`h-20 border border-border bg-accent ${utility}`}
                  aria-hidden="true"
                />
                <p className="font-mono text-xs">{utility}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl tracking-normal">Cienie</h3>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {SHADOWS.map((utility) => (
              <div key={utility} className="space-y-4">
                <div
                  className={`h-20 rounded-lg border border-border bg-card ${utility}`}
                  aria-hidden="true"
                />
                <p className="font-mono text-xs">{utility}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section aria-labelledby="gradients-heading" className="space-y-6">
        <h2 id="gradients-heading" className="text-3xl tracking-normal">
          Gradienty
        </h2>
        {GRADIENTS.map(([token, utility]) => (
          <div key={token} className="space-y-3">
            <div className={`h-20 rounded-lg border border-border ${utility}`} aria-hidden="true" />
            <p className="font-mono text-xs">{token}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
