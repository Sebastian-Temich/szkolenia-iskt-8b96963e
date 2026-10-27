import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { komunikatBledu } from "@/lib/panel/bledy";
import type { TrenerPanel } from "@/lib/panel/typy";
import {
  formularzNaTrenera,
  schematTrenera,
  type FormularzTrenera as Wartosci,
} from "@/lib/panel/walidacja";
import { EdytorDoswiadczenia, EdytorWyksztalcenia } from "./EdytoryTrenera";
import { PolaTrenera } from "./PolaTrenera";
import { SekcjaFormularza } from "./pola";
import { WyborPowiazan, type OpcjaPowiazania } from "./WyborPowiazan";

/** Formularz tworzenia i edycji trenera z przypisaniem szkoleń. */
export function FormularzTrenera(props: {
  edycja: boolean;
  wartosci: Wartosci;
  redakcja: Pick<TrenerPanel, "status" | "publishedAt">;
  szkolenia: OpcjaPowiazania[];
  przypisane: string[];
  onZapisz: (model: TrenerPanel, przypisane: string[]) => Promise<void>;
}) {
  const formularz = useForm<Wartosci>({
    resolver: zodResolver(schematTrenera),
    defaultValues: props.wartosci,
  });
  const [przypisane, setPrzypisane] = useState(props.przypisane);
  const [blad, setBlad] = useState<string | null>(null);
  const wyslij = formularz.handleSubmit(async (w) => {
    setBlad(null);
    try {
      await props.onZapisz(formularzNaTrenera(w, props.redakcja), przypisane);
    } catch (e) {
      setBlad(komunikatBledu(e, "Nie udało się zapisać trenera. Spróbuj ponownie."));
    }
  });
  const maBledy = Object.keys(formularz.formState.errors).length > 0;
  return (
    <FormProvider {...formularz}>
      <form onSubmit={wyslij} noValidate className="flex flex-col gap-5">
        <PolaTrenera edycja={props.edycja} />
        <EdytorDoswiadczenia />
        <EdytorWyksztalcenia />
        <SekcjaFormularza tytul="Szkolenia">
          <WyborPowiazan idPola="tr-szkolenia" etykieta="Szkolenia" opcje={props.szkolenia}
            wybrane={przypisane} onZmiana={setPrzypisane} />
        </SekcjaFormularza>
        {maBledy ? (
          <p role="alert" className="rounded-md bg-[var(--error-50)] p-3 text-sm text-destructive">
            Popraw zaznaczone pola, zanim zapiszesz trenera.
          </p>
        ) : null}
        {blad ? (
          <p role="alert" className="rounded-md bg-[var(--error-50)] p-3 text-sm text-destructive">
            {blad}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="rounded-pill" disabled={formularz.formState.isSubmitting}>
            <Save aria-hidden="true" />
            {formularz.formState.isSubmitting ? "Zapisujemy…" : "Zapisz trenera"}
          </Button>
          <Button asChild variant="outline" className="rounded-pill">
            <Link to="/panel/trenerzy">Anuluj</Link>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
