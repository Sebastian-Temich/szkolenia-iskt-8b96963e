import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Trener } from "@/lib/trenerzy/typy";
import { AvatarTrenera } from "./AvatarTrenera";
import { PlakietkiObszarow } from "./PlakietkiObszarow";

/** Cała karta trenera jest typowanym linkiem do profilu — jak karta szkolenia w katalogu. */
export function KartaTrenera({ trener }: { trener: Trener }) {
  return (
    <Link
      to="/trenerzy/$id"
      params={{ id: trener.id }}
      className="flex h-full flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-8)] shadow-[var(--shadow-sm)] transition duration-[var(--dur-base)] ease-standard hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] motion-reduce:transform-none"
    >
      <div className="flex items-center gap-4">
        <AvatarTrenera trener={trener} className="size-16" rozmiarTekstu="text-[22px]" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-bold tracking-[var(--ls-tight)]">{trener.name}</h2>
          <span className="text-sm font-semibold text-primary">{trener.role}</span>
        </span>
      </div>
      <PlakietkiObszarow areas={trener.areas} />
      <p className="text-sm text-muted-foreground">{trener.tagline}</p>
      <span className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary">
        Zobacz CV <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
