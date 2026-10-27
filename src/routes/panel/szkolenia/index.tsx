import { createFileRoute } from "@tanstack/react-router";
import { ListaSzkolen } from "@/components/panel/ListaSzkolen";

export const Route = createFileRoute("/panel/szkolenia/")({
  head: () => ({ meta: [{ title: "Szkolenia — Panel redakcyjny ISKT" }] }),
  component: ListaSzkolen,
});
