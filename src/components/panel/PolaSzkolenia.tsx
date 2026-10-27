import { useFormContext } from "react-hook-form";
import { KATEGORIE_SZKOLEN } from "@/lib/szkolenia/adapter";
import { IKONY_OBSZAROW } from "@/lib/panel/typy";
import type { FormularzSzkolenia } from "@/lib/panel/walidacja";
import { KLASY_INPUT, KLASY_TEXTAREA, PoleFormularza, SekcjaFormularza, ariaPola } from "./pola";

const NAZWY_IKON: Record<(typeof IKONY_OBSZAROW)[number], string> = {
  cpu: "Procesor (AI)",
  leaf: "Liść (ESG)",
  languages: "Języki",
  "code-xml": "Kod",
  "flask-conical": "Kolba (B+R)",
};

/** Podstawowe pola szkolenia: identyfikator, kategoria, opisy, cena. */
export function PolaSzkolenia({ edycja }: { edycja: boolean }) {
  const { register, formState } = useFormContext<FormularzSzkolenia>();
  const e = formState.errors;
  const opisId = edycja
    ? "Identyfikatora nie można zmienić po utworzeniu — zmiana zepsułaby publiczne linki do szkolenia."
    : "Część adresu strony szkolenia: małe litery, cyfry i myślniki, np. genai-dla-biznesu.";
  return (
    <SekcjaFormularza tytul="Podstawowe informacje">
      <div className="grid gap-4 sm:grid-cols-2">
        <PoleFormularza id="sz-id" etykieta="Identyfikator" blad={e.id?.message} opis={opisId}>
          <input
            className={`${KLASY_INPUT} font-mono`}
            readOnly={edycja}
            {...ariaPola("sz-id", e.id?.message, true)}
            {...register("id")}
          />
        </PoleFormularza>
        <PoleFormularza id="sz-kolejnosc" etykieta="Kolejność" blad={e.sortOrder?.message}>
          <input
            type="number"
            min={0}
            step={1}
            className={KLASY_INPUT}
            {...ariaPola("sz-kolejnosc", e.sortOrder?.message)}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </PoleFormularza>
      </div>
      <PoleFormularza id="sz-tytul" etykieta="Tytuł" blad={e.title?.message}>
        <input
          className={KLASY_INPUT}
          {...ariaPola("sz-tytul", e.title?.message)}
          {...register("title")}
        />
      </PoleFormularza>
      <div className="grid gap-4 sm:grid-cols-2">
        <PoleFormularza id="sz-kategoria" etykieta="Kategoria" blad={e.cat?.message}>
          <select
            className={KLASY_INPUT}
            {...ariaPola("sz-kategoria", e.cat?.message)}
            {...register("cat")}
          >
            {KATEGORIE_SZKOLEN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </PoleFormularza>
        <PoleFormularza id="sz-ikona" etykieta="Ikona" blad={e.icon?.message}>
          <select
            className={KLASY_INPUT}
            {...ariaPola("sz-ikona", e.icon?.message)}
            {...register("icon")}
          >
            {IKONY_OBSZAROW.map((i) => (
              <option key={i} value={i}>
                {NAZWY_IKON[i]}
              </option>
            ))}
          </select>
        </PoleFormularza>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <PoleFormularza id="sz-poziom" etykieta="Poziom" blad={e.level?.message}>
          <input
            className={KLASY_INPUT}
            {...ariaPola("sz-poziom", e.level?.message)}
            {...register("level")}
          />
        </PoleFormularza>
        <PoleFormularza id="sz-czas" etykieta="Czas trwania" blad={e.hours?.message}>
          <input
            className={KLASY_INPUT}
            {...ariaPola("sz-czas", e.hours?.message)}
            {...register("hours")}
          />
        </PoleFormularza>
        <PoleFormularza id="sz-format" etykieta="Format" blad={e.format?.message}>
          <input
            className={KLASY_INPUT}
            {...ariaPola("sz-format", e.format?.message)}
            {...register("format")}
          />
        </PoleFormularza>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PoleFormularza id="sz-cena" etykieta="Cena (PLN brutto, pełna)" blad={e.price?.message}>
          <input
            type="number"
            min={0}
            step={1}
            className={KLASY_INPUT}
            {...ariaPola("sz-cena", e.price?.message)}
            {...register("price", { valueAsNumber: true })}
          />
        </PoleFormularza>
        <PoleFormularza
          id="sz-plakietka"
          etykieta="Plakietka (opcjonalnie)"
          blad={e.badge?.message}
          opis="Zostaw puste, jeśli szkolenie nie ma plakietki."
        >
          <input
            className={KLASY_INPUT}
            {...ariaPola("sz-plakietka", e.badge?.message, true)}
            {...register("badge")}
          />
        </PoleFormularza>
      </div>
      <label className="flex items-center gap-2 text-[14.5px] font-medium">
        <input
          type="checkbox"
          className="size-4 accent-[var(--green-700)]"
          {...register("fundable")}
        />
        Szkolenie kwalifikuje się do dofinansowania
      </label>
      <PoleFormularza id="sz-opis" etykieta="Opis" blad={e.desc?.message}>
        <textarea
          rows={4}
          className={KLASY_TEXTAREA}
          {...ariaPola("sz-opis", e.desc?.message)}
          {...register("desc")}
        />
      </PoleFormularza>
      <PoleFormularza
        id="sz-dla-kogo"
        etykieta="Dla kogo jest to szkolenie"
        blad={e.forWhom?.message}
      >
        <textarea
          rows={3}
          className={KLASY_TEXTAREA}
          {...ariaPola("sz-dla-kogo", e.forWhom?.message)}
          {...register("forWhom")}
        />
      </PoleFormularza>
    </SekcjaFormularza>
  );
}
