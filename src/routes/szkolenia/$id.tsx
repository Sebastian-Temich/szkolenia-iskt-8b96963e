import { createFileRoute, notFound } from "@tanstack/react-router";
import { getSzkolenie } from "@/lib/szkolenia/adapter";
import { SzczegolSzkolenia } from "@/components/szkolenia/SzczegolSzkolenia";
import { SzczegolSzkielet } from "@/components/szkolenia/Szkielety";
import { BladSzkolen, NieZnalezionoSzkolenia } from "@/components/szkolenia/StanySzkolen";

export const Route = createFileRoute("/szkolenia/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    demo: search["demo"] === "ladowanie" || search["demo"] === "blad" ? search["demo"] : undefined,
  }),
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ params, deps }) => {
    const szkolenie = await getSzkolenie(params.id, { demo: deps.demo });
    if (!szkolenie) throw notFound();
    return szkolenie;
  },
  pendingMs: 150,
  pendingComponent: SzczegolSzkielet,
  errorComponent: ({ reset }) => <BladSzkolen reset={reset} szczegol />,
  onError: (error) => console.error(error),
  notFoundComponent: NieZnalezionoSzkolenia,
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.title} — Szkolenia ISKT`
      : "Szkolenie niedostępne — Szkolenia ISKT";
    const description = loaderData?.desc ?? "Sprawdź pełny katalog szkoleń ISKT.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(!loaderData ? [{ name: "robots", content: "noindex" }] : []),
      ],
    };
  },
  component: Szczegol,
});

/** Displays the selected training returned by the route loader. */
function Szczegol() {
  return <SzczegolSzkolenia szkolenie={Route.useLoaderData()} />;
}
