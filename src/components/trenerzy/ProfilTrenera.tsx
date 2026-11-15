import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Award, Check } from "lucide-react";
import { OknoZapisu } from "@/components/szkolenia/OknoZapisu";
import { Button } from "@/components/ui/button";
import type { Szkolenie } from "@/lib/szkolenia/typy";
import type { Trener } from "@/lib/trenerzy/typy";
import { AvatarTrenera } from "./AvatarTrenera";
import { PlakietkiObszarow } from "./PlakietkiObszarow";

/**
 * Profil trenera w układzie CV z makiety: biogram, doświadczenie i wykształcenie w
 * kolumnie głównej, specjalizacje, prowadzone szkolenia i zapytanie o termin w kolumnie
 * bocznej. `szkolenia` to druga strona powiązania — stąd prowadzi droga do oferty.
 */
export function ProfilTrenera({ trener, szkolenia }: { trener: Trener; szkolenia: Szkolenie[] }) {
  return (
    <>
      <section className="bg-[var(--surface-muted)] pb-[clamp(2.5rem,4vw,3.5rem)] pt-[clamp(2rem,4vw,3rem)]">
        <div className="mx-auto max-w-[var(--container-max)] space-y-6 px-[var(--container-pad)]">
          <nav aria-label="Ścieżka nawigacji" className="flex items-center gap-3 text-sm">
            <Link to="/trenerzy" className="inline-flex items-center gap-2 text-primary">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Nasi Trenerzy
            </Link>
            <span className="text-[var(--neutral-400)]" aria-hidden="true">
              /
            </span>
            <span>{trener.name}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-[clamp(1.25rem,3vw,2rem)]">
            <AvatarTrenera trener={trener} className="size-24" rozmiarTekstu="text-[32px]" />
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-4xl font-extrabold tracking-[var(--ls-tighter)] md:text-5xl">
                {trener.name}
              </h1>
              <p className="text-lg font-semibold text-primary">{trener.role}</p>
              <PlakietkiObszarow areas={trener.areas} wariant="naglowek" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[var(--container-max)] items-start gap-[clamp(1.5rem,3vw,3rem)] px-[var(--container-pad)] py-[var(--section-pad-y)] lg:grid-cols-[1.35fr_0.65fr]">
        <div className="flex min-w-0 flex-col gap-[var(--space-12)]">
          <section aria-labelledby="o-mnie-heading" className="space-y-4">
            <h2 id="o-mnie-heading" className="text-2xl font-extrabold tracking-[var(--ls-tight)]">
              O mnie
            </h2>
            <p className="max-w-[72ch] text-base leading-[var(--lh-relaxed)]">{trener.bio}</p>
          </section>
          {trener.experience.length > 0 && (
            <section aria-labelledby="doswiadczenie-heading" className="space-y-4">
              <h2
                id="doswiadczenie-heading"
                className="text-2xl font-extrabold tracking-[var(--ls-tight)]"
              >
                Doświadczenie zawodowe
              </h2>
              <ol className="flex flex-col">
                {trener.experience.map((pozycja) => (
                  <li
                    key={`${pozycja.period}-${pozycja.title}`}
                    className="grid gap-2 border-t border-[var(--border-subtle)] py-[var(--space-5)] sm:grid-cols-[130px_1fr] sm:gap-[var(--space-5)]"
                  >
                    <span className="font-mono text-[13px] font-semibold text-[var(--green-600)]">
                      {pozycja.period}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-base font-bold">{pozycja.title}</span>
                      <span className="text-sm font-semibold text-primary">{pozycja.org}</span>
                      <span className="text-sm text-muted-foreground">{pozycja.desc}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {trener.education.length > 0 && (
            <section aria-labelledby="wyksztalcenie-heading" className="space-y-4">
              <h2
                id="wyksztalcenie-heading"
                className="text-2xl font-extrabold tracking-[var(--ls-tight)]"
              >
                Wykształcenie i certyfikaty
              </h2>
              <ul className="space-y-3">
                {trener.education.map((pozycja) => (
                  <li
                    key={`${pozycja.title}-${pozycja.org}`}
                    className="flex items-start gap-3 rounded-md border border-[var(--border-subtle)] bg-card px-[var(--space-6)] py-[var(--space-5)] shadow-[var(--shadow-xs)]"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--green-50)] text-primary">
                      <Award className="size-[15px]" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[15px] font-bold">{pozycja.title}</span>
                      <span className="text-[13.5px] text-muted-foreground">{pozycja.org}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="flex flex-col gap-[var(--space-6)] lg:sticky lg:top-[88px]">
          {trener.skills.length > 0 && (
            <section
              aria-labelledby="specjalizacje-heading"
              className="rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-sm)]"
            >
              <h2
                id="specjalizacje-heading"
                className="text-[13px] font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-600)]"
              >
                Specjalizacje
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {trener.skills.map((umiejetnosc) => (
                  <li key={umiejetnosc} className="flex items-center gap-2.5 text-sm">
                    <Check className="size-4 shrink-0 text-[var(--green-600)]" aria-hidden="true" />
                    {umiejetnosc}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section
            aria-labelledby="prowadzi-heading"
            className="rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-sm)]"
          >
            <h2
              id="prowadzi-heading"
              className="text-[13px] font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-600)]"
            >
              Prowadzi szkolenia
            </h2>
            {szkolenia.length > 0 ? (
              <ul className="mt-3.5 space-y-2">
                {szkolenia.map((szkolenie) => (
                  <li key={szkolenie.id}>
                    <Link
                      to="/szkolenia/$id"
                      params={{ id: szkolenie.id }}
                      className="flex items-center justify-between gap-2.5 rounded-md border border-[var(--border-subtle)] bg-background px-3.5 py-3 text-sm font-semibold hover:border-primary hover:bg-[var(--green-50)]"
                    >
                      {szkolenie.title}
                      <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3.5 text-sm text-muted-foreground">
                Ten trener nie ma teraz przypisanego szkolenia w otwartej ofercie. Zapytaj o
                szkolenie zamknięte.
              </p>
            )}
          </section>
          <aside
            aria-labelledby="zapytaj-heading"
            className="rounded-lg bg-[var(--ink-900)] p-[var(--space-6)] text-white"
          >
            {/* Reguła `h1..h6 { color: var(--text-primary) }` ze `styles.css` bije dziedziczenie
                po `text-white` rodzica, więc na ciemnej karcie kolor nagłówka musi być jawny. */}
            <h2 id="zapytaj-heading" className="text-[15px] font-bold text-white">
              Chcesz szkolenie z tym trenerem?
            </h2>
            <p className="mt-2.5 text-sm leading-[var(--lh-relaxed)] text-white/85">
              Zapytaj o dostępne terminy szkoleń otwartych i zamkniętych.
            </p>
            {/* F-05, #41: to samo okno co „Zapytaj o termin dla firmy” na stronie szkolenia.
                Jedyne szkolenie trenera jest wybrane; przy żadnym albo kilku pole jest puste. */}
            <OknoZapisu
              wariant="company"
              szkolenie={szkolenia.length === 1 ? szkolenia[0] : undefined}
              opis={trener.name}
              wiadomoscPoczatkowa={`Pytanie o szkolenie z trenerem: ${trener.name}`}
            >
              <Button
                type="button"
                className="mt-4 h-[46px] w-full whitespace-normal rounded-pill bg-white px-3 text-[15px] font-bold text-[var(--green-800)] hover:bg-[var(--green-50)]"
              >
                Zapytaj o termin <ArrowRight aria-hidden="true" />
              </Button>
            </OknoZapisu>
          </aside>
        </div>
      </section>
    </>
  );
}
