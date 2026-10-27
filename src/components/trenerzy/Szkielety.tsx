import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { NaglowekTrenerow } from "./NaglowekTrenerow";

/** Odwzorowuje wymiary karty trenera, żeby podmiana na kartę realną nie dawała przeskoku. */
function KartaSzkielet() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-8)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-pill" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-6 w-32 rounded-pill" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}

/** Zachowuje nagłówek i siatkę listy trenerów w trakcie ładowania. */
export function TrenerzySzkielet() {
  return (
    <section
      className="mx-auto max-w-[var(--container-max)] space-y-8 px-[var(--container-pad)] pb-[var(--section-pad-y)] pt-[clamp(2.5rem,5vw,4rem)]"
      aria-busy="true"
      aria-label="Wczytujemy listę trenerów"
    >
      <NaglowekTrenerow />
      <div className="grid grid-cols-1 gap-[var(--space-6)] sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <KartaSzkielet key={i} />
        ))}
      </div>
    </section>
  );
}

/** Rezerwuje wymiary profilu trenera, zanim loader się rozwiąże. */
export function ProfilSzkielet() {
  return (
    <section
      className="bg-[var(--surface-muted)] pb-[clamp(2.5rem,4vw,3.5rem)] pt-[clamp(2rem,4vw,3rem)]"
      aria-busy="true"
      aria-label="Wczytujemy profil trenera"
    >
      <div className="mx-auto max-w-[var(--container-max)] space-y-6 px-[var(--container-pad)]">
        <nav aria-label="Ścieżka nawigacji">
          <Link to="/trenerzy" className="inline-flex items-center gap-2 text-sm text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Nasi Trenerzy
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-[clamp(1.25rem,3vw,2rem)]">
          <Skeleton className="size-24 rounded-pill" />
          <div className="space-y-3">
            <Skeleton className="h-11 w-72" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-7 w-40 rounded-pill" />
          </div>
        </div>
      </div>
    </section>
  );
}
