import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

/**
 * Każda pozycja stopki ma istniejący cel w tym etapie: obszary prowadzą do katalogu
 * z filtrem kategorii, pozycje dla firm do zakotwiczeń strony głównej. Pozycji bez celu
 * w tym etapie w stopce nie ma — martwy link jest gorszy niż brak linku.
 */
type LinkStopki = { label: string; to: "/" | "/szkolenia"; hash?: string; kategoria?: string };
const LINK_GROUPS: { title: string; items: LinkStopki[] }[] = [
  {
    title: "Obszary",
    items: [
      { label: "AI", to: "/szkolenia", kategoria: "AI" },
      { label: "ESG", to: "/szkolenia", kategoria: "ESG" },
      { label: "Język angielski", to: "/szkolenia", kategoria: "Angielski" },
      // Jedna etykieta obejmuje dwie kategorie, a filtr katalogu przyjmuje jedną.
      // Filtrowanie po jednej z nich ukryłoby połowę tego, co obiecuje etykieta.
      { label: "Software · B+R", to: "/szkolenia" },
    ],
  },
  {
    title: "Dla firm",
    items: [
      { label: "Szkolenia zamknięte", to: "/", hash: "kontakt" },
      { label: "Dofinansowania", to: "/", hash: "dofinansowania" },
      { label: "Audyt kompetencji", to: "/", hash: "kontakt" },
    ],
  },
];
const HEADING_CLASS =
  "text-[length:var(--text-footer-heading)] font-bold uppercase tracking-[var(--ls-wide)] text-foreground";

/** Renderuje informacje o marce i dostarczone dane kontaktowe. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-[var(--container-pad)] pt-[var(--section-pad-y)] pb-[var(--space-10)]">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="grid gap-[var(--space-8)] border-b border-border pb-[var(--space-10)] md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-[var(--space-4)]">
            <Logo className="h-[calc(var(--space-10)+var(--space-1))]" />
            <p className="text-sm leading-[var(--lh-relaxed)] text-muted-foreground">
              Szkolenia rozwijające kompetencje przyszłości — dla osób indywidualnych i firm.
              Innowacje w harmonii z naturą.
            </p>
            <p className="font-mono text-xs tracking-[var(--ls-wide)] text-primary">
              szkolenia.iskt.pl
            </p>
          </div>
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className={HEADING_CLASS}>{group.title}</h2>
              <ul className="mt-[var(--space-5)] space-y-[var(--space-3)]">
                {group.items.map(({ label, to, hash, kategoria }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      {...(hash ? { hash } : {})}
                      {...(kategoria ? { search: { kategoria } } : {})}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className={HEADING_CLASS}>Kontakt</h2>
            <ul className="mt-[var(--space-5)] space-y-[var(--space-3)] text-sm text-muted-foreground">
              <li className="break-words">szkolenia@iskt.pl</li>
              <li>
                +48 32 000 00 00
                <span className="block text-xs">Numer przykładowy</span>
              </li>
              <li>Żory, woj. śląskie</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-[var(--space-3)] pt-[var(--space-6)] text-[length:var(--text-footer-bottom)] text-[var(--text-secondary)]">
          <p>© 2026 ISKT Greenovation Sp. z o.o. Wszelkie prawa zastrzeżone.</p>
          <p>Polityka prywatności · Regulamin</p>
        </div>
      </div>
    </footer>
  );
}
