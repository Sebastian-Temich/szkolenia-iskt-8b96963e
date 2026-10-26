import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

const DESCRIPTION =
  "Szkolenia rozwijające kompetencje przyszłości — dla osób indywidualnych i firm. Innowacje w harmonii z naturą.";
const HIGHLIGHTS = ["Dofinansowanie do 80%", "Certyfikat ISKT", "Zajęcia z ekspertami"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Szkolenia ISKT — rozwijaj swoje kompetencje" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Szkolenia ISKT — rozwijaj swoje kompetencje" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Displays only the owner's approved introductory content. */
function Index() {
  return (
    <section className="bg-background py-[var(--section-pad-y)]">
      <div className="mx-auto max-w-[var(--container-max)] space-y-6 px-[var(--container-pad)]">
        <p className="text-xs font-bold uppercase tracking-[var(--ls-caps)] text-primary">
          SZKOLENIA ISKT
        </p>
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-normal md:text-5xl">
          Rozwijaj swoje kompetencje z ISKT
        </h1>
        <p className="max-w-[60ch] text-lg text-muted-foreground">{DESCRIPTION}</p>
        <ul className="flex flex-wrap gap-3 pt-4">
          {HIGHLIGHTS.map((label) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-pill bg-[var(--green-50)] px-4 py-2 text-sm text-[var(--green-900)]"
            >
              <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
