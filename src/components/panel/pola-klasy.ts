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

