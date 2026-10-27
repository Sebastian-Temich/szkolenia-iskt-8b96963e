import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKomunikat } from "./komunikat-kontekst";

const KLASY_LINKU =
  "rounded-pill px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] outline-none hover:bg-[var(--green-50)] hover:text-primary focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]";

/** Nagłówek panelu z nawigacją, adresem zalogowanego i wylogowaniem. */
export function UkladPanelu(props: { email: string; onWyloguj: () => void; children: ReactNode }) {
  const { tresc } = useKomunikat();
  return (
    <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-6 px-[var(--container-pad)] py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex flex-wrap items-center gap-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-600)]">
            Panel redakcyjny
          </p>
          <nav aria-label="Nawigacja panelu" className="flex gap-1">
            <Link
              to="/panel/szkolenia"
              className={KLASY_LINKU}
              activeProps={{
                className: "bg-[var(--green-50)] text-primary",
                "aria-current": "page",
              }}
            >
              Szkolenia
            </Link>
            <Link
              to="/panel/trenerzy"
              className={KLASY_LINKU}
              activeProps={{
                className: "bg-[var(--green-50)] text-primary",
                "aria-current": "page",
              }}
            >
              Trenerzy
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">{props.email}</span>
          <Button type="button" variant="outline" size="sm" onClick={props.onWyloguj}>
            <LogOut aria-hidden="true" />
            Wyloguj
          </Button>
        </div>
      </div>
      <div role="status" aria-live="polite" aria-label="Komunikaty panelu">
        {tresc ? (
          <p className="rounded-md border border-[var(--border-subtle)] bg-[var(--green-50)] px-4 py-3 text-sm font-medium text-primary">
            {tresc}
          </p>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}
