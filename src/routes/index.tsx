import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "szkolenia.iskt — szkolenia z RODO, AI Act i cyberbezpieczeństwa" },
      {
        name: "description",
        content: "Praktyczne szkolenia dla firm i sektora publicznego: RODO, AI Act, cyberbezpieczeństwo.",
      },
      { property: "og:title", content: "szkolenia.iskt" },
      {
        property: "og:description",
        content: "Praktyczne szkolenia dla firm i sektora publicznego.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Sample training catalogue — placeholder content until real offer is provided. */
const TRAININGS = [
  { code: "01", title: "RODO w praktyce", desc: "Obowiązki administratora, rejestr czynności, obsługa żądań.", meta: "1 dzień · online" },
  { code: "02", title: "AI Act dla zespołów", desc: "Klasyfikacja ryzyka, transparentność, nadzór człowieka.", meta: "1 dzień · stacjonarnie" },
  { code: "03", title: "Cyberbezpieczeństwo i NIS2", desc: "Zarządzanie incydentami i odpowiedzialność kierownictwa.", meta: "2 dni · hybrydowo" },
] as const;

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold">
          szkolenia<span className="text-accent">.</span>iskt
        </span>
        <Button variant="outline" asChild>
          <a href="#kontakt">Kontakt</a>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-28">
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Szkolenia dla firm i administracji
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] md:text-7xl">
            Wiedza, która przechodzi <em className="text-primary">audyt</em>.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-muted-foreground">
            Praktyczne szkolenia z RODO, AI Act i cyberbezpieczeństwa — prowadzone przez praktyków, z materiałami gotowymi do wdrożenia.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#oferta">Zobacz ofertę</a>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <a href="#kontakt">Szkolenie zamknięte</a>
            </Button>
          </div>
        </section>

        <section id="oferta" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="mb-12 text-3xl font-semibold md:text-4xl">Oferta</h2>
            <ul className="divide-y divide-border border-y border-border">
              {TRAININGS.map((t) => (
                <li key={t.code} className="grid gap-2 py-8 md:grid-cols-[80px_1fr_200px] md:items-baseline">
                  <span className="font-display text-accent">{t.code}</span>
                  <div>
                    <h3 className="text-2xl font-semibold">{t.title}</h3>
                    <p className="mt-2 text-muted-foreground">{t.desc}</p>
                  </div>
                  <span className="text-sm text-muted-foreground md:text-right">{t.meta}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="kontakt" className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-semibold md:text-4xl">Porozmawiajmy o szkoleniu dla Twojego zespołu.</h2>
            <p className="mt-4 opacity-80">kontakt@iskt.pl</p>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        © 2026 ISKT
      </footer>
    </div>
  );
}
