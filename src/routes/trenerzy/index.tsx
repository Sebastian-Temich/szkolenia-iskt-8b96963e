import { createFileRoute } from "@tanstack/react-router";
import { KartaTrenera } from "@/components/trenerzy/KartaTrenera";
import { NaglowekTrenerow, OPIS_TRENEROW } from "@/components/trenerzy/NaglowekTrenerow";
import { BladTrenerow } from "@/components/trenerzy/StanyTrenerow";
import { TrenerzySzkielet } from "@/components/trenerzy/Szkielety";
import { listTrenerzy } from "@/lib/trenerzy/adapter";

const TYTUL = "Nasi Trenerzy — Szkolenia ISKT";

export const Route = createFileRoute("/trenerzy/")({
  loader: () => listTrenerzy(),
  pendingMs: 150,
  pendingComponent: TrenerzySzkielet,
  errorComponent: ({ reset }) => <BladTrenerow reset={reset} />,
  onError: (error) => console.error(error),
  head: () => ({
    meta: [
      { title: TYTUL },
      { name: "description", content: OPIS_TRENEROW },
      { property: "og:title", content: TYTUL },
      { property: "og:description", content: OPIS_TRENEROW },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trenerzy,
});

/** Wyświetla opublikowanych trenerów albo uczciwy stan pusty. */
function Trenerzy() {
  const trenerzy = Route.useLoaderData();
  return (
    <section className="mx-auto max-w-[var(--container-max)] space-y-8 px-[var(--container-pad)] pb-[var(--section-pad-y)] pt-[clamp(2.5rem,5vw,4rem)]">
      <NaglowekTrenerow />
      {trenerzy.length ? (
        <div className="grid grid-cols-1 gap-[var(--space-6)] sm:grid-cols-2 lg:grid-cols-3">
          {trenerzy.map((trener) => (
            <KartaTrenera key={trener.id} trener={trener} />
          ))}
        </div>
      ) : (
        <div className="space-y-5 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-8)] shadow-[var(--shadow-sm)]">
          <h2 className="text-2xl font-extrabold tracking-[var(--ls-tight)]">
            Profile trenerów przygotowujemy
          </h2>
          <p className="max-w-[60ch] text-muted-foreground">
            Nie mamy tu jeszcze opublikowanych profili. Katalog szkoleń działa normalnie — a jeśli
            szukasz konkretnego eksperta, napisz do nas.
          </p>
        </div>
      )}
    </section>
  );
}
