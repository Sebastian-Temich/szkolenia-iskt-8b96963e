import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KartaSzkolenia } from "@/components/szkolenia/KartaSzkolenia";
import { PolecaneSzkielet } from "@/components/szkolenia/Szkielety";
import { listSzkolenia } from "@/lib/szkolenia/adapter";
import { NaglowekSekcji } from "./NaglowekSekcji";
import { wybierzPolecane } from "./tresci";

const OUTLINE =
  "rounded-pill border-[1.5px] border-primary font-semibold text-primary hover:bg-[var(--green-50)]";

/** Shows the error or empty state in place of the featured grid. */
function Komunikat({
  naglowek,
  ponow,
  czeka,
  blad = false,
}: {
  naglowek: string;
  blad?: boolean;
  ponow?: () => void;
  czeka?: boolean;
}) {
  return (
    <div
      {...(blad ? { role: "alert" } : {})}
      className="flex flex-col items-start gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-[var(--space-8)] shadow-[var(--shadow-sm)]"
    >
      <h3 className="text-[1.15rem] font-bold tracking-[var(--ls-tight)]">{naglowek}</h3>
      {ponow && (
        <>
          <p className="text-muted-foreground">
            Spróbuj ponownie — jeśli problem się powtórzy, odezwij się do nas.
          </p>
          <Button className="rounded-pill" onClick={ponow} disabled={czeka}>
            <RotateCcw aria-hidden="true" /> Spróbuj ponownie
          </Button>
        </>
      )}
      <Link
        to="/szkolenia"
        className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Przejdź do katalogu
      </Link>
    </div>
  );
}

/** Fetches trainings through the adapter and shows the four featured ones. */
export function PolecaneSzkolenia() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["szkolenia", "polecane"],
    queryFn: () => listSzkolenia(),
  });
  const polecane = data ? wybierzPolecane(data) : [];

  return (
    <section aria-labelledby="polecane-naglowek" className="py-[var(--section-pad-y)]">
      <div className="mx-auto max-w-[var(--container-max)] space-y-10 px-[var(--container-pad)]">
        <div className="flex flex-wrap items-end justify-between gap-[var(--space-6)]">
          <NaglowekSekcji
            id="polecane-naglowek"
            eyebrow="Wyróżnione szkolenia"
            naglowek="Najczęściej wybierane"
          />
          <Button asChild variant="outline" className={`h-[46px] px-5 text-[15px] ${OUTLINE}`}>
            <Link to="/szkolenia">
              Cały katalog <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {isPending ? (
          <PolecaneSzkielet />
        ) : isError ? (
          <Komunikat
            naglowek="Nie udało się wczytać polecanych szkoleń"
            blad
            ponow={() => void refetch()}
            czeka={isFetching}
          />
        ) : polecane.length === 0 ? (
          <Komunikat naglowek="Nie znaleźliśmy polecanych szkoleń" />
        ) : (
          <div className="grid gap-[var(--space-6)] sm:grid-cols-2 xl:grid-cols-4">
            {polecane.map((s) => (
              <KartaSzkolenia key={s.id} szkolenie={s} as="h3" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
