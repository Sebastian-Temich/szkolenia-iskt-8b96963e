import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const LINK_GROUPS = [
  { title: "Obszary", items: ["AI", "ESG", "Język angielski", "Software · B+R", "Nasi Trenerzy"] },
  { title: "Dla firm", items: ["Szkolenia zamknięte", "Dofinansowania", "Audyt kompetencji"] },
];
const HEADING_CLASS =
  "text-[length:calc(var(--text-xs)+var(--border-width))] font-bold uppercase tracking-[var(--ls-wide)] text-foreground";

/** Renders brand information and the supplied contact details. */
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
                {group.items.map((label) => (
                  <li key={label}>
                    <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
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
        <div className="flex flex-wrap justify-between gap-[var(--space-3)] pt-[var(--space-6)] text-[length:calc(var(--text-xs)+var(--border-width))] text-[var(--text-muted)]">
          <p>© 2026 ISKT Greenovation Sp. z o.o. Wszelkie prawa zastrzeżone.</p>
          <p>Polityka prywatności · Regulamin</p>
        </div>
      </div>
    </footer>
  );
}