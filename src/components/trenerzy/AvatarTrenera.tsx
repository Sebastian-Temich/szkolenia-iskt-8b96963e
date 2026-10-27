import type { Trener } from "@/lib/trenerzy/typy";
import { cn } from "@/lib/utils";

/**
 * Awatar trenera: zdjęcie, jeśli redakcja podała adres, inaczej inicjały na gradiencie
 * marki — tak jak w makiecie. Inicjały są dekoracją obok widocznego nazwiska, więc
 * element pozostaje poza drzewem dostępności, zamiast powtarzać tę samą treść.
 */
export function AvatarTrenera({
  trener,
  className,
  rozmiarTekstu,
}: {
  trener: Pick<Trener, "name" | "initials" | "photoUrl">;
  className?: string;
  rozmiarTekstu: string;
}) {
  const wspolne = cn("shrink-0 overflow-hidden rounded-pill", className);
  if (trener.photoUrl) {
    return (
      <img
        src={trener.photoUrl}
        alt={`Zdjęcie: ${trener.name}`}
        className={cn(wspolne, "object-cover")}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        wspolne,
        rozmiarTekstu,
        "inline-flex items-center justify-center bg-[image:var(--gradient-brand)] font-extrabold text-white",
      )}
    >
      {trener.initials}
    </span>
  );
}
