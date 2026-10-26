import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KatalogNaglowek } from "./KatalogNaglowek";
import { FiltryKatalogu } from "./FiltryKatalogu";

/** Preserves catalog heading, filters and card tracks during loading. */
export function KatalogSzkielet() {
  return (
    <section
      className="mx-auto max-w-[var(--container-max)] space-y-8 px-[var(--container-pad)] pb-[var(--section-pad-y)] pt-[clamp(2.5rem,5vw,4rem)]"
      aria-busy="true"
      aria-label="Wczytujemy katalog szkoleń"
    >
      <KatalogNaglowek />
      <FiltryKatalogu />
      <div className="h-[21px]">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-[var(--space-6)] sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex min-h-[432px] flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="size-10" />
              <Skeleton className="h-5 w-24 rounded-pill" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[63px] w-full" />
            <Skeleton className="h-[56px] w-full" />
            <div className="mt-auto space-y-3 border-t border-border pt-[14px]">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Reserves four featured-card tracks on the home page while trainings load. */
export function PolecaneSzkielet() {
  return (
    <div
      className="grid gap-[var(--space-6)] sm:grid-cols-2 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Wczytujemy polecane szkolenia"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex min-h-[432px] flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="size-10" />
            <Skeleton className="h-5 w-24 rounded-pill" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[63px] w-full" />
          <Skeleton className="h-[56px] w-full" />
          <div className="mt-auto space-y-3 border-t border-border pt-[14px]">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Reserves detail content and price-card dimensions while the loader resolves. */
export function SzczegolSzkielet() {
  return (
    <section
      className="bg-[var(--surface-muted)] pb-[clamp(2.5rem,4vw,3.5rem)] pt-[clamp(2rem,4vw,3rem)]"
      aria-busy="true"
      aria-label="Wczytujemy szkolenie"
    >
      <div className="mx-auto max-w-[var(--container-max)] space-y-8 px-[var(--container-pad)]">
        <nav aria-label="Ścieżka nawigacji">
          <Link to="/szkolenia" className="inline-flex items-center gap-2 text-sm text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Katalog
          </Link>
        </nav>
        <div className="grid items-start gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <Skeleton className="h-7 w-60 rounded-pill" />
            <Skeleton className="h-[104px] w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-16" />
              ))}
            </div>
          </div>
          <div className="min-h-[480px] rounded-lg border border-border bg-card p-[var(--space-8)] shadow-[var(--shadow-md)]">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="mt-4 h-[54px] rounded-pill" />
            <Skeleton className="mt-4 h-12 rounded-pill" />
            <Skeleton className="mt-6 h-36 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
