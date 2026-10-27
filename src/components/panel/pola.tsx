import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wspólne klasy pól formularzy panelu, oparte na tokenach marki. */
export const KLASY_POLA =
  "w-full rounded-md border border-[var(--border-default)] bg-background px-3 text-[15px] text-foreground outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] aria-[invalid=true]:border-destructive disabled:bg-muted disabled:text-muted-foreground";
export const KLASY_INPUT = cn(KLASY_POLA, "h-10");
export const KLASY_TEXTAREA = cn(KLASY_POLA, "py-2 resize-y");

/** Atrybuty dostępności wiążące pole z opisem i komunikatem błędu. */
export function ariaPola(id: string, blad?: string, maOpis = false) {
  const opisane = [maOpis ? `${id}-opis` : null, blad ? `${id}-blad` : null].filter(Boolean);
  return {
    id,
    "aria-invalid": blad ? true : undefined,
    "aria-describedby": opisane.length ? opisane.join(" ") : undefined,
  } as const;
}

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
