import { createFileRoute } from "@tanstack/react-router";
import { EdycjaSzkolenia } from "@/components/panel/StronySzkolen";

export const Route = createFileRoute("/panel/szkolenia/$id")({
  head: () => ({ meta: [{ title: "Edycja szkolenia — Panel redakcyjny ISKT" }] }),
  component: Edycja,
});

function Edycja() {
  const { id } = Route.useParams();
  return <EdycjaSzkolenia id={id} />;
}
