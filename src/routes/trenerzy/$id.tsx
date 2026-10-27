import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProfilTrenera } from "@/components/trenerzy/ProfilTrenera";
import { BladTrenerow, NieZnalezionoTrenera } from "@/components/trenerzy/StanyTrenerow";
import { ProfilSzkielet } from "@/components/trenerzy/Szkielety";
import { getTrener, szkoleniaTrenera } from "@/lib/trenerzy/adapter";

export const Route = createFileRoute("/trenerzy/$id")({
  loader: async ({ params }) => {
    const trener = await getTrener(params.id);
    if (!trener) throw notFound();
    return { trener, szkolenia: await szkoleniaTrenera(trener.id) };
  },
  pendingMs: 150,
  pendingComponent: ProfilSzkielet,
  errorComponent: ({ reset }) => <BladTrenerow reset={reset} profil />,
  onError: (error) => console.error(error),
  notFoundComponent: NieZnalezionoTrenera,
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.trener.name} — Szkolenia ISKT`
      : "Profil niedostępny — Szkolenia ISKT";
    const description = loaderData?.trener.tagline ?? "Poznaj trenerów ISKT.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(!loaderData ? [{ name: "robots", content: "noindex" }] : []),
      ],
    };
  },
  component: Profil,
});

/** Wyświetla profil trenera razem z jego opublikowanymi szkoleniami. */
function Profil() {
  const { trener, szkolenia } = Route.useLoaderData();
  return <ProfilTrenera trener={trener} szkolenia={szkolenia} />;
}
