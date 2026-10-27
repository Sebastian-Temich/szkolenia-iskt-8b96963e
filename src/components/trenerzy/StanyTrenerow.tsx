import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Nieudany odczyt trenerów kończy się ponowieniem, a nie pustą listą: puste „nie mamy
 * trenerów" przy zerwanym połączeniu byłoby nieprawdą. Treść wyjątku nie wychodzi do UI.
 */
export function BladTrenerow({ reset, profil = false }: { reset: () => void; profil?: boolean }) {
  const router = useRouter();
  return (
    <section
      role="alert"
      className="mx-auto max-w-[var(--container-max)] space-y-5 px-[var(--container-pad)] py-[var(--section-pad-y)]"
    >
      <h1 className="text-3xl font-extrabold tracking-[var(--ls-tighter)]">
        {profil ? "Nie udało się wczytać profilu trenera" : "Nie udało się wczytać listy trenerów"}
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

/** Droga powrotu dla nieznanego albo nieopublikowanego profilu trenera. */
export function NieZnalezionoTrenera() {
  return (
    <section className="mx-auto max-w-[var(--container-max)] space-y-5 px-[var(--container-pad)] py-[var(--section-pad-y)]">
      <h1 className="text-3xl font-extrabold tracking-[var(--ls-tighter)]">
        Nie znaleźliśmy tego trenera
      </h1>
      <p className="max-w-[60ch] text-lg text-muted-foreground">
        Ten profil mógł zostać zmieniony lub wycofany. Sprawdź pełną listę — przedstawimy Ci całą
        kadrę.
      </p>
      <Button asChild className="rounded-pill">
        <Link to="/trenerzy">
          <ArrowLeft aria-hidden="true" />
          Wróć do listy trenerów
        </Link>
      </Button>
    </section>
  );
}
