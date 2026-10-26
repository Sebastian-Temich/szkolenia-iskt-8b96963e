import { createFileRoute, notFound, type SearchSchemaInput } from "@tanstack/react-router";
import { getSzkolenie } from "@/lib/szkolenia/adapter";
import { czytajFiltryPowrotu, type PowrotDoKatalogu } from "@/components/szkolenia/powrot";
import { SzczegolSzkolenia } from "@/components/szkolenia/SzczegolSzkolenia";
import { SzczegolSzkielet } from "@/components/szkolenia/Szkielety";
import { BladSzkolen, NieZnalezionoSzkolenia } from "@/components/szkolenia/StanySzkolen";

export const Route = createFileRoute("/szkolenia/$id")({
  // Trasa przenosi filtry katalogu, żeby powrót ze szczegółu wracał do tego samego
  // wyniku, a nie do pełnej listy.
  validateSearch: (
    search: { kategoria?: unknown; q?: unknown } & SearchSchemaInput,
  ): PowrotDoKatalogu => czytajFiltryPowrotu(search),
  loader: async ({ params }) => {
    const szkolenie = await getSzkolenie(params.id);
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

/** Wyświetla szkolenie zwrócone przez loader trasy. */
function Szczegol() {
  const { kategoria, q } = Route.useSearch();
  return (
    <SzczegolSzkolenia
      szkolenie={Route.useLoaderData()}
      powrot={{ ...(kategoria ? { kategoria } : {}), ...(q ? { q } : {}) }}
    />
  );
}
