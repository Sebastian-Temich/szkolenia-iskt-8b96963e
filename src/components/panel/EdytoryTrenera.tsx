import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormularzTrenera } from "@/lib/panel/walidacja";
import { KLASY_INPUT, KLASY_TEXTAREA, PoleFormularza, SekcjaFormularza, ariaPola } from "./pola";

/** Edytor doświadczenia zawodowego trenera. */
export function EdytorDoswiadczenia() {
  const { register, control, formState } = useFormContext<FormularzTrenera>();
  const { fields, append, remove } = useFieldArray({ control, name: "experience" });
  const b = formState.errors.experience;
  return (
    <SekcjaFormularza tytul="Doświadczenie">
      {fields.map((f, i) => (
        <div
          key={f.id}
          className="grid gap-3 rounded-md border border-[var(--border-subtle)] p-3 sm:grid-cols-3"
        >
          <PoleFormularza id={`tr-dosw-${i}-okres`} etykieta="Okres" blad={b?.[i]?.period?.message}>
            <input
              className={KLASY_INPUT}
              {...ariaPola(`tr-dosw-${i}-okres`, b?.[i]?.period?.message)}
              {...register(`experience.${i}.period`)}
            />
          </PoleFormularza>
          <PoleFormularza
            id={`tr-dosw-${i}-stanowisko`}
            etykieta="Stanowisko"
            blad={b?.[i]?.title?.message}
          >
            <input
              className={KLASY_INPUT}
              {...ariaPola(`tr-dosw-${i}-stanowisko`, b?.[i]?.title?.message)}
              {...register(`experience.${i}.title`)}
            />
          </PoleFormularza>
          <PoleFormularza
            id={`tr-dosw-${i}-org`}
            etykieta="Organizacja"
            blad={b?.[i]?.org?.message}
          >
            <input
              className={KLASY_INPUT}
              {...ariaPola(`tr-dosw-${i}-org`, b?.[i]?.org?.message)}
              {...register(`experience.${i}.org`)}
            />
          </PoleFormularza>
          <PoleFormularza
            id={`tr-dosw-${i}-opis`}
            etykieta="Opis"
            blad={b?.[i]?.desc?.message}
            className="sm:col-span-3"
          >
            <textarea
              rows={2}
              className={KLASY_TEXTAREA}
              {...ariaPola(`tr-dosw-${i}-opis`, b?.[i]?.desc?.message)}
              {...register(`experience.${i}.desc`)}
            />
          </PoleFormularza>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start"
            onClick={() => remove(i)}
          >
            <Trash2 aria-hidden="true" />
            Usuń pozycję doświadczenia {i + 1}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => append({ period: "", title: "", org: "", desc: "" })}
      >
        <Plus aria-hidden="true" />
        Dodaj doświadczenie
      </Button>
    </SekcjaFormularza>
  );
}

/** Edytor wykształcenia trenera. */
export function EdytorWyksztalcenia() {
  const { register, control, formState } = useFormContext<FormularzTrenera>();
  const { fields, append, remove } = useFieldArray({ control, name: "education" });
  const b = formState.errors.education;
  return (
    <SekcjaFormularza tytul="Wykształcenie">
      {fields.map((f, i) => (
        <div key={f.id} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <PoleFormularza
            id={`tr-wyk-${i}-tytul`}
            etykieta="Tytuł lub kierunek"
            blad={b?.[i]?.title?.message}
          >
            <input
              className={KLASY_INPUT}
              {...ariaPola(`tr-wyk-${i}-tytul`, b?.[i]?.title?.message)}
              {...register(`education.${i}.title`)}
            />
          </PoleFormularza>
          <PoleFormularza
            id={`tr-wyk-${i}-org`}
            etykieta="Uczelnia lub instytucja"
            blad={b?.[i]?.org?.message}
          >
            <input
              className={KLASY_INPUT}
              {...ariaPola(`tr-wyk-${i}-org`, b?.[i]?.org?.message)}
              {...register(`education.${i}.org`)}
            />
          </PoleFormularza>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Usuń pozycję wykształcenia ${i + 1}`}
            onClick={() => remove(i)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => append({ title: "", org: "" })}
      >
        <Plus aria-hidden="true" />
        Dodaj wykształcenie
      </Button>
    </SekcjaFormularza>
  );
}
