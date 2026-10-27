import { Outlet, createFileRoute } from "@tanstack/react-router";
import { BramkaDostepu } from "@/components/panel/BramkaDostepu";
import { DostawcaKomunikatu } from "@/components/panel/komunikat";
import { UkladPanelu } from "@/components/panel/UkladPanelu";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel redakcyjny — Szkolenia ISKT" },
      { name: "description", content: "Panel redakcyjny treści serwisu Szkolenia ISKT." },
      { property: "og:title", content: "Panel redakcyjny — Szkolenia ISKT" },
      { property: "og:description", content: "Panel redakcyjny treści serwisu Szkolenia ISKT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Panel,
});

/** Układ panelu: dane wyłącznie po stronie klienta, za bramką dostępu. */
function Panel() {
  return (
    <DostawcaKomunikatu>
      <BramkaDostepu>
        {(redaktor) => (
          <UkladPanelu email={redaktor.email} onWyloguj={redaktor.wyloguj}>
            <Outlet />
          </UkladPanelu>
        )}
      </BramkaDostepu>
    </DostawcaKomunikatu>
  );
}
