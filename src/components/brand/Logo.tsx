import { cn } from "@/lib/utils";

// Znak marki ISKT (liść + motyw circuit) dostarczony przez właściciela marki.
// Plik źródłowy: public/iskt-logo-transparent.png ( RGBA, tło przezroczyste).
// Nie przerysowuj znaku i nie generuj jego zamiennika graficznego.
// Wariant z białym tłem: public/iskt-logo.png — użyj go tylko tam, gdzie
// znak musi leżeć na nieprzezroczystej jasnej płaszczyźnie.

/** Renders the supplied ISKT brand mark. Height is set by the caller's className. */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/iskt-logo-transparent.png"
      alt="ISKT Greenovation"
      width={640}
      height={529}
      className={cn("w-auto max-w-full object-contain", className)}
    />
  );
}
