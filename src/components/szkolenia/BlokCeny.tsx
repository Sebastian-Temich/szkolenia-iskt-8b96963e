import {
  etykietaCenyGlownej,
  etykietaCenyPelnej,
  NOTA_CENY,
  TEKST_DOFINANSOWANIA,
} from "@/lib/szkolenia/adapter";

/** Renders the same funding calculation in catalog and detail views. */
export function BlokCeny({ price, wariant }: { price: number; wariant: "karta" | "szczegol" }) {
  const detail = wariant === "szczegol";
  return (
    <div className="space-y-2">
      {detail && <p className="text-sm font-medium text-muted-foreground">Cena szkolenia</p>}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={`${detail ? "text-3xl" : "text-lg"} whitespace-nowrap font-extrabold tracking-[var(--ls-tighter)] text-primary`}
        >
          {etykietaCenyGlownej(price)}
        </span>
        <span className="text-xs font-medium text-primary">{TEKST_DOFINANSOWANIA}</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{etykietaCenyPelnej(price)}</p>
      {detail && <p className="text-xs text-muted-foreground">{NOTA_CENY}</p>}
    </div>
  );
}
