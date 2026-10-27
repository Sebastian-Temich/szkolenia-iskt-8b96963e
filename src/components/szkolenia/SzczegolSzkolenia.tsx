import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Banknote, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
import type { Trener } from "@/lib/trenerzy/typy";
import { KartaZapisu } from "./KartaZapisu";
import { MetrykiSzkolenia } from "./MetrykiSzkolenia";
import { ProwadzacySzkolenie } from "./ProwadzacySzkolenie";
import type { PowrotDoKatalogu } from "./powrot";

/**
 * Renderuje opis, efekty i program szkolenia właściciela bez wymyślonych treści.
 * `powrot` to filtry katalogu przeniesione przez adres — bez nich powrót gubi wynik.
 * `trenerzy` to przypisani prowadzący; pusta lista nie rysuje bloku prowadzących.
 */
export function SzczegolSzkolenia({
  szkolenie,
  powrot = {},
  trenerzy = [],
}: {
  szkolenie: Szkolenie;
  powrot?: PowrotDoKatalogu;
  trenerzy?: Trener[];
}) {
  return (
    <>
      <section className="bg-[var(--surface-muted)] pb-[clamp(2.5rem,4vw,3.5rem)] pt-[clamp(2rem,4vw,3rem)]">
        <div className="mx-auto max-w-[var(--container-max)] space-y-8 px-[var(--container-pad)]">
          <nav aria-label="Ścieżka nawigacji" className="flex items-center gap-3 text-sm">
            <Link
              to="/szkolenia"
              search={powrot}
              className="inline-flex items-center gap-2 text-primary"
            >
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
      <section
        className={`mx-auto grid max-w-[var(--container-max)] gap-[clamp(1.5rem,3vw,3rem)] px-[var(--container-pad)] py-[var(--section-pad-y)] ${
          szkolenie.fundable || trenerzy.length ? "lg:grid-cols-[1.35fr_0.65fr]" : "lg:grid-cols-1"
        }`}
      >
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
        {(szkolenie.fundable || trenerzy.length > 0) && (
          <div className="flex flex-col gap-[var(--space-6)] lg:sticky lg:top-[88px]">
            <ProwadzacySzkolenie trenerzy={trenerzy} />
            {szkolenie.fundable && (
              <aside
                aria-labelledby="dofinansowanie-heading"
                className="rounded-lg bg-[var(--ink-900)] p-[var(--space-6)] text-white"
              >
                <h2
                  id="dofinansowanie-heading"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-300)]"
                >
                  <Banknote className="size-4" aria-hidden="true" />
                  Dofinansowanie
                </h2>
                <p className="mt-3 text-[14.5px] leading-[var(--lh-relaxed)] text-white/85">
                  To szkolenie kwalifikuje się do dofinansowania z KFS i BUR. Pomożemy Ci przejść
                  przez formalności.
                </p>
                <Button
                  asChild
                  className="mt-4 h-[46px] w-full whitespace-normal rounded-pill bg-white px-3 text-[15px] font-bold text-[var(--green-800)] hover:bg-[var(--green-50)]"
                >
                  <Link to="/" hash="kontakt">
                    Sprawdź dofinansowanie <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </aside>
            )}
          </div>
        )}
      </section>
    </>
  );
}
