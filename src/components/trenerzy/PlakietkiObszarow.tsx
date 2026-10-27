import type { KategoriaSzkolenia } from "@/lib/szkolenia/typy";
import { cn } from "@/lib/utils";

/** Obszary trenera jako plakietki — te same nazwy kategorii, co filtry katalogu. */
export function PlakietkiObszarow({
  areas,
  wariant = "karta",
}: {
  areas: KategoriaSzkolenia[];
  wariant?: "karta" | "naglowek";
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {areas.map((area) => (
        <li
          key={area}
          className={cn(
            "inline-flex rounded-pill border px-2.5 py-1 text-xs font-semibold text-[var(--green-800)]",
            wariant === "karta"
              ? "border-[var(--green-200)] bg-[var(--green-50)]"
              : "border-[var(--green-200)] bg-card",
          )}
        >
          {area}
        </li>
      ))}
    </ul>
  );
}
