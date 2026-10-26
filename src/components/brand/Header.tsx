import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

type NavItem = { label: string; to: "/" | "/szkolenia"; hash?: string };
const NAV_ITEMS: NavItem[] = [
  { label: "Obszary", to: "/", hash: "obszary" },
  { label: "Katalog", to: "/szkolenia" },
  { label: "Dofinansowania", to: "/", hash: "dofinansowania" },
  { label: "Kontakt", to: "/", hash: "kontakt" },
];
const CTA_CLASS =
  "h-[calc(var(--space-10)+var(--space-1))] rounded-pill bg-primary px-[var(--space-5)] text-[length:var(--text-cta)] font-semibold text-primary-foreground shadow-brand transition-colors duration-[var(--dur-fast)] ease-standard hover:bg-[var(--green-800)]";

/** Renderuje wspólną nawigację i dostępne menu mobilne. */
export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/82 backdrop-blur-md">
      <nav
        aria-label="Nawigacja główna"
        className="mx-auto flex h-[var(--nav-h)] max-w-[var(--container-max)] items-center justify-between gap-[var(--space-6)] px-[var(--container-pad)]"
      >
        <Link
          to="/"
          onClick={() => setIsOpen(false)}
          className="flex min-w-0 items-center gap-[var(--space-4)]"
          aria-label="ISKT — strona główna"
        >
          <Logo className="h-[var(--logo-h-header)]" />
          <span className="hidden max-w-[calc(var(--space-32)+var(--space-24))] text-[length:var(--text-logo)] leading-[var(--lh-tight)] font-extrabold tracking-normal text-foreground sm:block">
            Rozwijaj swoje kompetencje z ISKT
          </span>
        </Link>
        <div className="hidden items-center gap-[var(--space-5)] xl:flex">
          {NAV_ITEMS.map(({ label, to, hash }) => (
            <Link
              key={label}
              to={to}
              {...(hash ? { hash } : {})}
              className="whitespace-nowrap text-[length:var(--text-nav)] font-medium text-[var(--ink-800)] hover:text-primary"
            >
              {label}
            </Link>
          ))}
          <Button asChild className={CTA_CLASS}>
            <Link to="/" hash="kontakt">
              Zapisz się <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-primary xl:hidden"
          aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </nav>
      {isOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Nawigacja mobilna"
          className="border-t border-border bg-background px-[var(--container-pad)] py-[var(--space-6)] xl:hidden"
        >
          <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-start gap-[var(--space-5)]">
            {NAV_ITEMS.map(({ label, to, hash }) => (
              <Link
                key={label}
                to={to}
                {...(hash ? { hash } : {})}
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                {label}
              </Link>
            ))}
            <Button asChild className={CTA_CLASS}>
              <Link to="/" hash="kontakt" onClick={() => setIsOpen(false)}>
                Zapisz się <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
