/** Displays the owner's catalog heading verbatim in ready and pending states. */
export function KatalogNaglowek() {
  return (
    <div className="space-y-5">
      <p className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-600)]">
        <span className="h-0.5 w-[22px] rounded-sm bg-current" aria-hidden="true" />
        Katalog szkoleń
      </p>
      <h1 className="max-w-[24ch] text-4xl font-extrabold tracking-[var(--ls-tighter)] md:text-5xl">
        Znajdź szkolenie dla siebie lub zespołu
      </h1>
      <p className="max-w-[60ch] text-lg text-muted-foreground">
        Filtruj według obszaru lub wyszukaj temat. Szkolenia otwarte i zamknięte, z możliwością
        dofinansowania.
      </p>
    </div>
  );
}
