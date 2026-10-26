import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
import { BlokCeny } from "./BlokCeny";
import { IkonaKategorii } from "./IkonaKategorii";
import { MetrykiSzkolenia } from "./MetrykiSzkolenia";

/** Makes the entire training card a typed detail link. */
export function KartaSzkolenia({ szkolenie }: { szkolenie: Szkolenie }) {
  return (
    <Link to="/szkolenia/$id" params={{ id: szkolenie.id }} className="flex h-full min-h-[432px] flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-sm)] transition duration-[var(--dur-base)] ease-standard hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] motion-reduce:transform-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--green-50)] text-primary"><IkonaKategorii icon={szkolenie.icon} /></span>
          <span className="font-mono text-[11px] tracking-[0.04em] text-[var(--green-600)]">{szkolenie.cat}</span>
        </div>
        {szkolenie.fundable && <span className="rounded-pill bg-[var(--green-100)] px-[9px] py-[3px] text-[10.5px] font-bold text-[var(--green-800)]">Dofinansowanie</span>}
      </div>
      <h2 className="text-lg font-bold tracking-[var(--ls-tight)]">{szkolenie.title}</h2>
      <p className="text-sm text-muted-foreground">{szkolenie.desc}</p>
      <MetrykiSzkolenia szkolenie={szkolenie} />
      <div className="mt-auto space-y-4 border-t border-[var(--border-subtle)] pt-[14px]">
        <BlokCeny price={szkolenie.price} wariant="karta" />
        <span className="flex items-center gap-2 text-sm font-semibold text-primary">Szczegóły <ArrowRight className="size-4" aria-hidden="true" /></span>
      </div>
    </Link>
  );
}
