import { useFormContext } from "react-hook-form";
import { KATEGORIE_SZKOLEN } from "@/lib/szkolenia/adapter";
import type { FormularzTrenera } from "@/lib/panel/walidacja";
import { KLASY_INPUT, KLASY_TEXTAREA, PoleFormularza, SekcjaFormularza, ariaPola } from "./pola"; // @@

/** Podstawowe pola trenera, obszary, umiejętności i adres zdjęcia. */
export function PolaTrenera({ edycja }: { edycja: boolean }) {
  const { register, formState } = useFormContext<FormularzTrenera>();
  const e = formState.errors;
  return (
    <SekcjaFormularza tytul="Podstawowe informacje">
      <div className="grid gap-4 sm:grid-cols-2">
        <PoleFormularza
          id="tr-id"
          etykieta="Identyfikator"
          blad={e.id?.message}
          opis={
            edycja
              ? "Identyfikatora nie można zmienić po utworzeniu — zmiana zepsułaby publiczne linki do profilu."
              : "Część adresu profilu: małe litery, cyfry i myślniki, np. anna-nowak."
          }
        >
          <input
            className={`${KLASY_INPUT} font-mono`}
            readOnly={edycja}
            {...ariaPola("tr-id", e.id?.message, true)}
            {...register("id")}
          />
        </PoleFormularza>
        <PoleFormularza id="tr-kolejnosc" etykieta="Kolejność" blad={e.sortOrder?.message}>
          <input
            type="number"
            min={0}
            step={1}
            className={KLASY_INPUT}
            {...ariaPola("tr-kolejnosc", e.sortOrder?.message)}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </PoleFormularza>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <PoleFormularza id="tr-imie" etykieta="Imię i nazwisko" blad={e.name?.message}>
          <input
            className={KLASY_INPUT}
            {...ariaPola("tr-imie", e.name?.message)}
            {...register("name")}
          />
        </PoleFormularza>
        <PoleFormularza id="tr-inicjaly" etykieta="Inicjały" blad={e.initials?.message}>
          <input
            className={KLASY_INPUT}
            {...ariaPola("tr-inicjaly", e.initials?.message)}
            {...register("initials")}
          />
        </PoleFormularza>
      </div>
      <PoleFormularza id="tr-rola" etykieta="Rola" blad={e.role?.message}>
        <input
          className={KLASY_INPUT}
          {...ariaPola("tr-rola", e.role?.message)}
          {...register("role")}
        />
      </PoleFormularza>
      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={e.areas ? "tr-obszary-blad" : undefined}
      >
        <legend className="text-[13.5px] font-semibold text-[var(--ink-800)]">Obszary</legend>
        <div className="flex flex-wrap gap-4">
          {KATEGORIE_SZKOLEN.map((k) => (
            <label key={k} className="flex items-center gap-2 text-[14.5px]">
              <input
                type="checkbox"
                value={k}
                className="size-4 accent-[var(--green-700)]"
                {...register("areas")}
              />
              {k}
            </label>
          ))}
        </div>
        {e.areas?.message ? (
          <p id="tr-obszary-blad" className="text-[13px] font-medium text-destructive">
            {e.areas.message}
          </p>
        ) : null}
      </fieldset>
      <PoleFormularza id="tr-haslo" etykieta="Hasło przewodnie" blad={e.tagline?.message}>
        <input
          className={KLASY_INPUT}
          {...ariaPola("tr-haslo", e.tagline?.message)}
          {...register("tagline")}
        />
      </PoleFormularza>
      <PoleFormularza id="tr-bio" etykieta="Biogram" blad={e.bio?.message}>
        <textarea
          rows={4}
          className={KLASY_TEXTAREA}
          {...ariaPola("tr-bio", e.bio?.message)}
          {...register("bio")}
        />
      </PoleFormularza>
      <PoleFormularza
        id="tr-umiejetnosci"
        etykieta="Umiejętności (jedna w wierszu)"
        blad={e.skillsTekst?.message}
      >
        <textarea
          rows={3}
          className={KLASY_TEXTAREA}
          {...ariaPola("tr-umiejetnosci", e.skillsTekst?.message)}
          {...register("skillsTekst")}
        />
      </PoleFormularza>
      <PoleFormularza
        id="tr-zdjecie"
        etykieta="Adres zdjęcia (opcjonalnie)"
        blad={e.photoUrl?.message}
        opis="Wklej pełny adres zdjęcia, np. https://… Zostaw puste, jeśli zdjęcia nie ma."
      >
        <input
          type="text"
          inputMode="url"
          className={KLASY_INPUT}
          {...ariaPola("tr-zdjecie", e.photoUrl?.message, true)}
          {...register("photoUrl")}
        />
      </PoleFormularza>
    </SekcjaFormularza>
  );
}
