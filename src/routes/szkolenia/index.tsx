import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FiltryKatalogu } from "@/components/szkolenia/FiltryKatalogu";
import { KatalogNaglowek } from "@/components/szkolenia/KatalogNaglowek";
import { KartaSzkolenia } from "@/components/szkolenia/KartaSzkolenia";
import { KatalogSzkielet } from "@/components/szkolenia/Szkielety";
import { BladSzkolen, NieZnalezionoSzkolenia } from "@/components/szkolenia/StanySzkolen";
import {
  KATEGORIE_SZKOLEN,
  listSzkolenia,
  opiszLiczbeWynikow,
  type FiltrSzkolen,
  type KategoriaSzkolenia,
} from "@/lib/szkolenia/adapter";
const DESCRIPTION =
  "Filtruj według obszaru lub wyszukaj temat. Szkolenia otwarte i zamknięte, z możliwością dofinansowania.";

export const Route = createFileRoute("/szkolenia/")({
  validateSearch: (
    search: { kategoria?: unknown; q?: unknown; demo?: unknown } & SearchSchemaInput,
  ): { kategoria: KategoriaSzkolenia | "Wszystkie"; q: string; demo: FiltrSzkolen["demo"] } => {
    const category =
      KATEGORIE_SZKOLEN.find((category) => category === search["kategoria"]) ?? "Wszystkie";
    const demo =
      search["demo"] === "ladowanie" || search["demo"] === "blad" ? search["demo"] : undefined;
    return { kategoria: category, q: typeof search["q"] === "string" ? search["q"] : "", demo };
  },
  loaderDeps: ({ search }) => ({ kategoria: search.kategoria, q: search.q, demo: search.demo }),
  loader: ({ deps }) => {
    const filtr: FiltrSzkolen = {
      kategoria: deps.kategoria,
      q: deps.q,
      ...(deps.demo ? { demo: deps.demo } : {}),
    };
    return listSzkolenia(filtr);
  },
  pendingMs: 150,
  pendingComponent: KatalogSzkielet,
  errorComponent: ({ reset }) => <BladSzkolen reset={reset} />,
  onError: (error) => console.error(error),
  notFoundComponent: NieZnalezionoSzkolenia,
  head: () => ({
    meta: [
      { title: "Katalog szkoleń — Szkolenia ISKT" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Katalog szkoleń — Szkolenia ISKT" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Katalog,
});

/** Displays filtered loader results or the approved empty state. */
function Katalog() {
  const szkolenia = Route.useLoaderData();
  const navigate = Route.useNavigate();
  return (
    <section className="mx-auto max-w-[var(--container-max)] space-y-8 px-[var(--container-pad)] pb-[var(--section-pad-y)] pt-[clamp(2.5rem,5vw,4rem)]">
      <KatalogNaglowek />
      <FiltryKatalogu />
      <p className="text-sm text-[var(--text-muted)]" role="status">
        {opiszLiczbeWynikow(szkolenia.length)}
      </p>
      {szkolenia.length ? (
        <div className="grid grid-cols-1 gap-[var(--space-6)] sm:grid-cols-2 lg:grid-cols-3">
          {szkolenia.map((item) => (
            <KartaSzkolenia key={item.id} szkolenie={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-5 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-8)] shadow-[var(--shadow-sm)]">
          <h2 className="text-2xl font-extrabold tracking-[var(--ls-tight)]">
            Brak szkoleń dla tych kryteriów
          </h2>
          <p className="max-w-[60ch] text-muted-foreground">
            Zmień obszar albo wyszukaj inną frazę — chętnie pomożemy dobrać temat dla Twojego
            zespołu.
          </p>
          <Button
            className="rounded-pill"
            onClick={() => {
              void navigate({ search: (prev) => ({ ...prev, kategoria: "Wszystkie", q: "" }) });
            }}
          >
            Wyczyść filtry
          </Button>
        </div>
      )}
    </section>
  );
}
