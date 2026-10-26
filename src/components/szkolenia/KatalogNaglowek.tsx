import { Eyebrow } from "@/components/brand/Eyebrow";

/** Zdanie prowadzące katalogu — jedno źródło dla nagłówka widoku i meta opisu trasy. */
export const OPIS_KATALOGU =
  "Filtruj według obszaru lub wyszukaj temat. Szkolenia otwarte i zamknięte, z możliwością dofinansowania.";

/** Wyświetla nagłówek katalogu właściciela dosłownie, w stanie gotowym i w trakcie ładowania. */
export function KatalogNaglowek() {
  return (
    <div className="space-y-5">
      <Eyebrow>Katalog szkoleń</Eyebrow>
      <h1 className="max-w-[24ch] text-4xl font-extrabold tracking-[var(--ls-tighter)] md:text-5xl">
        Znajdź szkolenie dla siebie lub zespołu
      </h1>
      <p className="max-w-[60ch] text-lg text-muted-foreground">{OPIS_KATALOGU}</p>
    </div>
  );
}
