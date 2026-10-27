import { createFileRoute } from "@tanstack/react-router";
import { NoweSzkolenie } from "@/components/panel/StronySzkolen";

export const Route = createFileRoute("/panel/szkolenia/nowe")({
  head: () => ({ meta: [{ title: "Nowe szkolenie — Panel redakcyjny ISKT" }] }),
  component: NoweSzkolenie,
});
