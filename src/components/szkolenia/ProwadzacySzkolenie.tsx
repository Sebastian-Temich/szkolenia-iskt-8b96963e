import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AvatarTrenera } from "@/components/trenerzy/AvatarTrenera";
import type { Trener } from "@/lib/trenerzy/typy";

/**
 * Prowadzący szkolenie — druga strona powiązania M:N. Makieta miała tu zastępczego
 * „Eksperta ISKT"; teraz są realni trenerzy, każdy z drogą do własnego profilu.
 * Przy braku przypisań blok się nie renderuje: lepiej nic nie obiecywać niż wymyślić osobę.
 */
export function ProwadzacySzkolenie({ trenerzy }: { trenerzy: Trener[] }) {
  if (!trenerzy.length) return null;
  return (
    <section
      aria-labelledby="prowadzacy-heading"
      className="rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-6)] shadow-[var(--shadow-sm)]"
    >
      <h2
        id="prowadzacy-heading"
        className="text-[13px] font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-600)]"
      >
        {trenerzy.length > 1 ? "Prowadzący" : "Prowadzący szkolenie"}
      </h2>
      <ul className="mt-3.5 space-y-2">
        {trenerzy.map((trener) => (
          <li key={trener.id}>
            <Link
              to="/trenerzy/$id"
              params={{ id: trener.id }}
              className="flex items-center gap-3.5 rounded-md border border-transparent px-2 py-2 hover:border-[var(--border-subtle)] hover:bg-[var(--green-50)]"
            >
              <AvatarTrenera trener={trener} className="size-13" rozmiarTekstu="text-[18px]" />
              <span className="flex min-w-0 flex-col">
                <span className="text-[15.5px] font-bold">{trener.name}</span>
                <span className="text-[13px] text-muted-foreground">{trener.role}</span>
              </span>
              <ArrowRight className="ml-auto size-4 shrink-0 text-primary" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
