import { Eyebrow } from "@/components/brand/Eyebrow";

/** Zdanie prowadzące listy trenerów — jedno źródło dla nagłówka widoku i meta opisu trasy. */
export const OPIS_TRENEROW =
  "Praktycy z realnym doświadczeniem w projektach AI, ESG, oprogramowaniu, B+R i nauczaniu języka. Poznaj ich ścieżkę zawodową.";

/** Wyświetla nagłówek listy trenerów dosłownie z makiety, też w trakcie ładowania. */
export function NaglowekTrenerow() {
  return (
    <div className="space-y-4">
      <Eyebrow>Nasi Trenerzy</Eyebrow>
      <h1 className="max-w-[24ch] text-4xl font-extrabold tracking-[var(--ls-tighter)] md:text-5xl">
        Ekspertki i eksperci, którzy Cię poprowadzą
      </h1>
      <p className="max-w-[60ch] text-lg text-muted-foreground">{OPIS_TRENEROW}</p>
    </div>
  );
}
