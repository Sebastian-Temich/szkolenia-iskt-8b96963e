import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { numerModulu, type FormularzSzkolenia } from "@/lib/panel/walidacja";
import { KLASY_INPUT, KLASY_TEXTAREA, PoleFormularza, SekcjaFormularza, ariaPola } from "./pola"; // @@

/** Edytor dokładnie czterech efektów szkolenia. */
export function EdytorEfektow() {
  const { register, formState } = useFormContext<FormularzSzkolenia>();
  const bledy = formState.errors.learn;
  return (
    <SekcjaFormularza tytul="Czego się nauczysz (4 pozycje)">
      {[0, 1, 2, 3].map((i) => {
        const blad = bledy?.[i]?.message;
        return (
          <PoleFormularza key={i} id={`sz-learn-${i}`} etykieta={`Efekt ${i + 1}`} blad={blad}>
            <input
              className={KLASY_INPUT}
              {...ariaPola(`sz-learn-${i}`, blad)}
              {...register(`learn.${i}`)}
            />
          </PoleFormularza>
        );
      })}
      {bledy?.message ? (
        <p className="text-[13px] font-medium text-destructive">{bledy.message}</p>
      ) : null}
    </SekcjaFormularza>
  );
}

/** Edytor modułów programu z automatycznym numerowaniem. */
export function EdytorProgramu() {
  const { register, control, formState } = useFormContext<FormularzSzkolenia>();
  const { fields, append, remove } = useFieldArray({ control, name: "program" });
  const bledy = formState.errors.program;
  return (
    <SekcjaFormularza tytul="Program szkolenia">
      <ol className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const blad = bledy?.[i]?.t?.message;
          return (
            <li key={f.id} className="flex items-end gap-2">
              <span
                className="pb-2.5 font-mono text-sm font-semibold text-[var(--green-600)]"
                aria-hidden="true"
              >
                {numerModulu(i)}
              </span>
              <PoleFormularza
                id={`sz-program-${i}`}
                etykieta={`Moduł ${numerModulu(i)}`}
                blad={blad}
                className="flex-1"
              >
                <input
                  className={KLASY_INPUT}
                  {...ariaPola(`sz-program-${i}`, blad)}
                  {...register(`program.${i}.t`)}
                />
              </PoleFormularza>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={fields.length <= 1}
                aria-label={`Usuń moduł ${numerModulu(i)}`}
                onClick={() => remove(i)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ol>
      {bledy?.message ? (
        <p className="text-[13px] font-medium text-destructive">{bledy.message}</p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={fields.length >= 24}
        onClick={() => append({ n: numerModulu(fields.length), t: "" })}
      >
        <Plus aria-hidden="true" />
        Dodaj moduł
      </Button>
    </SekcjaFormularza>
  );
}

const TRYBY = [
  { wartosc: "domyslne", etykieta: "Terminy domyślne" },
  { wartosc: "brak", etykieta: "Brak terminów" },
  { wartosc: "wlasne", etykieta: "Własna lista" },
] as const;

/** Edytor terminów w trzech jawnych trybach. */
export function EdytorTerminow() {
  const { register, watch, formState } = useFormContext<FormularzSzkolenia>();
  const tryb = watch("trybTerminow");
  const blad = formState.errors.terminyTekst?.message;
  return (
    <SekcjaFormularza tytul="Terminy">
      <p id="sz-terminy-opis" className="text-[13px] text-[var(--text-secondary)]">
        Terminy domyślne pokazują wspólny harmonogram ISKT, „brak terminów” nie pokazuje żadnego, a
        własna lista zastępuje harmonogram terminami tego szkolenia.
      </p>
      <div role="radiogroup" aria-describedby="sz-terminy-opis" className="flex flex-wrap gap-4">
        {TRYBY.map((t) => (
          <label key={t.wartosc} className="flex items-center gap-2 text-[14.5px]">
            <input
              type="radio"
              value={t.wartosc}
              className="accent-[var(--green-700)]"
              {...register("trybTerminow")}
            />
            {t.etykieta}
          </label>
        ))}
      </div>
      {tryb === "wlasne" ? (
        <PoleFormularza id="sz-terminy" etykieta="Terminy (jeden w wierszu)" blad={blad}>
          <textarea
            rows={3}
            className={KLASY_TEXTAREA}
            {...ariaPola("sz-terminy", blad)}
            {...register("terminyTekst")}
          />
        </PoleFormularza>
      ) : null}
    </SekcjaFormularza>
  );
}
