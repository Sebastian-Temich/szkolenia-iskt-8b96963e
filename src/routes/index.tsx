import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Dofinansowania } from "@/components/strona-glowna/Dofinansowania";
import { Hero } from "@/components/strona-glowna/Hero";
import { JakToDziala } from "@/components/strona-glowna/JakToDziala";
import { KategorieKompetencji } from "@/components/strona-glowna/KategorieKompetencji";
import { PolecaneSzkolenia } from "@/components/strona-glowna/PolecaneSzkolenia";
import { SciezkiOdbiorcy } from "@/components/strona-glowna/SciezkiOdbiorcy";
import { SekcjaKontakt } from "@/components/strona-glowna/SekcjaKontakt";
import type { Odbiorca } from "@/components/strona-glowna/tresci";

const TITLE = "Szkolenia ISKT — rozwijaj kompetencje przyszłości";
const DESCRIPTION =
  "Praktyczne szkolenia z AI, ESG, oprogramowania i języka angielskiego — prowadzone przez ekspertów, z dofinansowaniem nawet do 80%.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Composes the home page sections and holds the shared audience state. */
function Index() {
  const [odbiorca, setOdbiorca] = useState<Odbiorca>("individual");
  return (
    <>
      <Hero odbiorca={odbiorca} onZmiana={setOdbiorca} />
      <SciezkiOdbiorcy />
      <KategorieKompetencji />
      <PolecaneSzkolenia />
      <JakToDziala odbiorca={odbiorca} />
      <Dofinansowania />
      <SekcjaKontakt odbiorca={odbiorca} onZmiana={setOdbiorca} />
    </>
  );
}
