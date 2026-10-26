import { getRouteApi } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { KATEGORIE_SZKOLEN } from "@/lib/szkolenia/adapter";
const route = getRouteApi("/szkolenia/");

/** Keeps category in the URL and debounces search without adding history entries. */
export function FiltryKatalogu() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const [query, setQuery] = useState(search.q);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    setQuery(search.q);
    return () => clearTimeout(timer.current);
  }, [search.q]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
      <div className="flex flex-wrap gap-2" aria-label="Obszar szkolenia">
        {["Wszystkie", ...KATEGORIE_SZKOLEN].map((category) => (
          <Button
            key={category}
            variant="outline"
            aria-pressed={search.kategoria === category}
            className={`h-auto rounded-pill border px-[18px] py-[9px] text-sm shadow-none ${search.kategoria === category ? "border-primary bg-primary font-semibold text-primary-foreground hover:bg-[var(--green-800)] hover:text-primary-foreground" : "border-[var(--green-200)] bg-transparent font-medium text-[var(--green-800)] hover:bg-[var(--green-50)]"}`}
            onClick={() => {
              void navigate({ search: (prev) => ({ ...prev, kategoria: category }) });
            }}
          >
            {category}
          </Button>
        ))}
      </div>
      <div className="relative min-w-[240px] flex-1 sm:max-w-[300px]">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Szukaj szkolenia"
          placeholder="Szukaj szkolenia…"
          value={query}
          className="h-[46px] w-full rounded-pill border border-[var(--green-200)] bg-card pl-11 pr-4 text-sm placeholder:text-[var(--text-muted)]"
          onChange={(event) => {
            const q = event.target.value;
            setQuery(q);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              void navigate({ search: (prev) => ({ ...prev, q }), replace: true });
            }, 300);
          }}
        />
      </div>
    </div>
  );
}
