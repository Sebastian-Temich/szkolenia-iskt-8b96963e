import { createFileRoute } from "@tanstack/react-router";
import { ListaTrenerow } from "@/components/panel/ListaTrenerow";

export const Route = createFileRoute("/panel/trenerzy/")({
  head: () => ({ meta: [{ title: "Trenerzy — Panel redakcyjny ISKT" }] }),
  component: ListaTrenerow,
});
