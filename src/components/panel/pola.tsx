import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { KLASY_INPUT, KLASY_POLA, KLASY_TEXTAREA, ariaPola } from "./pola-klasy";

export { KLASY_INPUT, KLASY_POLA, KLASY_TEXTAREA, ariaPola };

type PoleProps = {
  id: string;
  etykieta: string;
  blad?: string | undefined;
  opis?: string;
  children: ReactNode;
  className?: string;
};

/** Pole formularza z widoczną etykietą, opisem i komunikatem błędu. */
export function PoleFormularza({ id, etykieta, blad, opis, children, className }: PoleProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13.5px] font-semibold text-[var(--ink-800)]">
        {etykieta}
      </label>
      {children}
      {opis ? (
        <p id={`${id}-opis`} className="text-[13px] text-[var(--text-secondary)]">
          {opis}
        </p>
      ) : null}
      {blad ? (
        <p id={`${id}-blad`} className="text-[13px] font-medium text-destructive">
          {blad}
        </p>
      ) : null}
    </div>
  );
}

/** Sekcja formularza z nagłówkiem h2. */
export function SekcjaFormularza({ tytul, children }: { tytul: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-5 shadow-[var(--shadow-xs)]">
      <legend className="px-1 text-base font-bold tracking-[var(--ls-tight)] text-foreground">
        {tytul}
      </legend>
      {children}
    </fieldset>
  );
}
