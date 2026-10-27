import { createFileRoute } from "@tanstack/react-router";
import { EdycjaTrenera } from "@/components/panel/StronyTrenerow";

export const Route = createFileRoute("/panel/trenerzy/$id")({
  head: () => ({ meta: [{ title: "Edycja trenera — Panel redakcyjny ISKT" }] }),
  component: Edycja,
});

function Edycja() {
  const { id } = Route.useParams();
  return <EdycjaTrenera id={id} />;
}
