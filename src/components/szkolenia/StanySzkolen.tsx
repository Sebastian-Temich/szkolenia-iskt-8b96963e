import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Ponawia loader bez pokazywania surowej treści wyjątku. */
export function BladSzkolen({
  reset,
  szczegol = false,
}: {
  reset: () => void;
  szczegol?: boolean;
}) {
  const router = useRouter();
  return (
    <section
      role="alert"
      className="mx-auto max-w-[var(--container-max)] space-y-5 px-[var(--container-pad)] py-[var(--section-pad-y)]"
    >
      <h1 className="text-3xl font-extrabold tracking-[var(--ls-tighter)]">
        {szczegol ? "Nie udało się wczytać szkolenia" : "Nie udało się wczytać katalogu"}
      </h1>
      <p className="text-lg text-muted-foreground">
        Spróbuj ponownie — jeśli problem się powtórzy, odezwij się do nas.
      </p>
      <Button
        className="rounded-pill"
        onClick={() => {
          void router.invalidate();
          reset();
        }}
      >
        <RotateCcw aria-hidden="true" />
        Spróbuj ponownie
      </Button>
    </section>
  );
}

/** Daje ścieżkę powrotu do katalogu dla nieznanego identyfikatora szkolenia. */
export function NieZnalezionoSzkolenia() {
  return (
    <section className="mx-auto max-w-[var(--container-max)] space-y-5 px-[var(--container-pad)] py-[var(--section-pad-y)]">
      <h1 className="text-3xl font-extrabold tracking-[var(--ls-tighter)]">
        Nie znaleźliśmy tego szkolenia
      </h1>
      <p className="max-w-[60ch] text-lg text-muted-foreground">
        Ten temat mógł zostać zmieniony lub usunięty z oferty. Sprawdź pełny katalog — na pewno
        znajdziesz coś dla siebie.
      </p>
      <Button asChild className="rounded-pill">
        <Link to="/szkolenia">
          <ArrowLeft aria-hidden="true" />
          Wróć do katalogu
        </Link>
      </Button>
    </section>
  );
}
