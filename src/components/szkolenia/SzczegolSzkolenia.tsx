import { Link } from "@tanstack/react-router";
import { ArrowLeft, Banknote, Check } from "lucide-react";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
import { KartaZapisu } from "./KartaZapisu";
import { MetrykiSzkolenia } from "./MetrykiSzkolenia";

/** Renders the owner's training description, outcomes and program without invented content. */
export function SzczegolSzkolenia({ szkolenie }: { szkolenie: Szkolenie }) {
  return (
    <>
      <section className="bg-[var(--surface-muted)] pb-[clamp(2.5rem,4vw,3.5rem)] pt-[clamp(2rem,4vw,3rem)]">
        <div className="mx-auto max-w-[var(--container-max)] space-y-8 px-[var(--container-pad)]">
          <nav aria-label="Ścieżka nawigacji" className="flex items-center gap-3 text-sm">
            <Link to="/szkolenia" className="inline-flex items-center gap-2 text-primary">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Katalog
            </Link>
            <span className="text-[var(--neutral-400)]" aria-hidden="true">
              /
            </span>
            <span>{szkolenie.cat}</span>
          </nav>
          <div className="grid items-start gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[1.35fr_0.65fr]">
            <div className="min-w-0 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-pill bg-primary px-3 py-[5px] text-[12.5px] font-semibold text-primary-foreground">
                  {szkolenie.cat}
                </span>
                {szkolenie.badge && (
                  <span className="rounded-pill bg-[var(--green-100)] px-3 py-[5px] text-[12.5px] font-semibold text-[var(--green-800)]">
                    {szkolenie.badge}
                  </span>
                )}
                {szkolenie.fundable && (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-[var(--green-200)] bg-card px-3 py-[5px] text-[12.5px] font-semibold text-[var(--green-800)]">
                    <Banknote className="size-4" aria-hidden="true" />
                    Dofinansowanie do 80%
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-extrabold tracking-[var(--ls-tighter)] md:text-5xl">
                {szkolenie.title}
              </h1>
              <p className="max-w-[58ch] text-xl text-muted-foreground">{szkolenie.desc}</p>
              <div className="pt-2">
                <MetrykiSzkolenia szkolenie={szkolenie} detail />
              </div>
            </div>
            <KartaZapisu szkolenie={szkolenie} />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[var(--container-max)] gap-[clamp(1.5rem,3vw,3rem)] px-[var(--container-pad)] py-[var(--section-pad-y)] lg:grid-cols-[1.35fr_0.65fr]">
        <div className="flex min-w-0 flex-col gap-[var(--space-12)]">
          <section aria-labelledby="learning-heading" className="space-y-6">
            <h2
              id="learning-heading"
              className="text-2xl font-extrabold tracking-[var(--ls-tight)]"
            >
              Czego się nauczysz
            </h2>
            <ul className="grid gap-[14px] sm:grid-cols-2">
              {szkolenie.learn.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-[var(--green-50)] text-primary">
                    <Check className="size-[14px]" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="program-heading" className="space-y-6">
            <h2 id="program-heading" className="text-2xl font-extrabold tracking-[var(--ls-tight)]">
              Program szkolenia
            </h2>
            <ol className="space-y-3">
              {szkolenie.program.map((module) => (
                <li
                  key={module.n}
                  className="flex items-center gap-4 rounded-md border border-[var(--border-subtle)] bg-card px-[var(--space-6)] py-[var(--space-5)] shadow-[var(--shadow-xs)]"
                >
                  <span className="w-[34px] shrink-0 font-mono text-[15px] font-semibold text-[var(--green-600)]">
                    {module.n}
                  </span>
                  <span className="text-[15.5px] font-semibold">{module.t}</span>
                </li>
              ))}
            </ol>
          </section>
          <section
            aria-labelledby="audience-heading"
            className="space-y-4 rounded-lg border border-[var(--green-200)] bg-[var(--surface-muted)] p-[var(--space-8)]"
          >
            <h2
              id="audience-heading"
              className="text-2xl font-extrabold tracking-[var(--ls-tight)]"
            >
              Dla kogo jest to szkolenie
            </h2>
            <p className="text-base text-muted-foreground">{szkolenie.forWhom}</p>
          </section>
        </div>
      </section>
    </>
  );
}
