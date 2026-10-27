import { createFileRoute } from "@tanstack/react-router";
import { NowyTrener } from "@/components/panel/StronyTrenerow";

export const Route = createFileRoute("/panel/trenerzy/nowy")({
  head: () => ({ meta: [{ title: "Nowy trener — Panel redakcyjny ISKT" }] }),
  component: NowyTrener,
});
