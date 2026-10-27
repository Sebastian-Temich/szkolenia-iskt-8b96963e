import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { komunikatBledu } from "@/lib/panel/bledy";
import type { SzkoleniePanel } from "@/lib/panel/typy";
import {
  formularzNaSzkolenie,
  schematSzkolenia,
  type FormularzSzkolenia as Wartosci,
} from "@/lib/panel/walidacja";
import { EdytorEfektow, EdytorProgramu, EdytorTerminow } from "./EdytoryTresci";
import { PolaSzkolenia } from "./PolaSzkolenia";
import { SekcjaFormularza } from "./pola";
import { WyborPowiazan, type OpcjaPowiazania } from "./WyborPowiazan";

/** Formularz tworzenia i edycji szkolenia z przypisaniem trenerów. */
export function FormularzSzkolenia(props: {
  edycja: boolean;
  wartosci: Wartosci;
  redakcja: Pick<SzkoleniePanel, "status" | "publishedAt">;
  trenerzy: OpcjaPowiazania[];
  przypisani: string[];
  onZapisz: (model: SzkoleniePanel, przypisani: string[]) => Promise<void>;
}) {
  const formularz = useForm<Wartosci>({
    resolver: zodResolver(schematSzkolenia),
    defaultValues: props.wartosci,
  });
  const [przypisani, setPrzypisani] = useState(props.przypisani);
  const [blad, setBlad] = useState<string | null>(null);
  const wyslij = formularz.handleSubmit(async (w) => {
    setBlad(null);
    try {
      await props.onZapisz(formularzNaSzkolenie(w, props.redakcja), przypisani);
    } catch (e) {
      setBlad(komunikatBledu(e, "Nie udało się zapisać szkolenia. Spróbuj ponownie."));
    }
  });
  const maBledy = Object.keys(formularz.formState.errors).length > 0;
  return (
    <FormProvider {...formularz}>
      <form onSubmit={wyslij} noValidate className="flex flex-col gap-5">
        <PolaSzkolenia edycja={props.edycja} />
        <EdytorEfektow />
        <EdytorProgramu />
        <EdytorTerminow />
        <SekcjaFormularza tytul="Trenerzy">
          <WyborPowiazan idPola="sz-trenerzy" etykieta="Trenerzy" opcje={props.trenerzy}
            wybrane={przypisani} onZmiana={setPrzypisani} />
        </SekcjaFormularza>
        {maBledy ? (
          <p role="alert" className="rounded-md bg-[var(--error-50)] p-3 text-sm text-destructive">
            Popraw zaznaczone pola, zanim zapiszesz szkolenie.
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
            {formularz.formState.isSubmitting ? "Zapisujemy…" : "Zapisz szkolenie"}
          </Button>
          <Button asChild variant="outline" className="rounded-pill">
            <Link to="/panel/szkolenia">Anuluj</Link>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
