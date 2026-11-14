import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { PrzelacznikOdbiorcy } from "./PrzelacznikOdbiorcy";
import { OPCJE_OBSZARU, trescKontaktu, type Odbiorca } from "./tresci";

const ETYKIETA_POLA = "text-[13.5px] font-semibold text-[var(--ink-800)]";
const KLASA_POLA =
  "rounded-md border border-[var(--border-default)] bg-background px-[14px] text-[15px] text-foreground outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]";
const IKONA =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--green-50)] text-primary";

type Props = { odbiorca: Odbiorca; onZmiana: (o: Odbiorca) => void };

/** Renderuje dane kontaktowe i wyłącznie wizualny, jeszcze niepodłączony formularz. */
export function SekcjaKontakt({ odbiorca, onZmiana }: Props) {
  const tresc = trescKontaktu(odbiorca);
  return (
    <section
      id="kontakt"
      aria-labelledby="kontakt-naglowek"
      className="scroll-mt-[calc(var(--space-16)+var(--space-6))] bg-[var(--surface-muted)] py-[var(--section-pad-y)]"
    >
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 items-start gap-[clamp(2rem,4vw,4rem)] px-[var(--container-pad)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <Eyebrow>Zgłoszenie</Eyebrow>
          <h2
            id="kontakt-naglowek"
            className="text-[clamp(2rem,3.4vw,2.6rem)] font-extrabold leading-[1.1] tracking-[var(--ls-tight)]"
          >
            {tresc.naglowek}
          </h2>
          <p className="text-lg text-muted-foreground">{tresc.wsparcie}</p>
          <ul className="mt-4 flex list-none flex-col gap-4">
            <li className="flex items-center gap-3">
              <span className={IKONA}>
                <Mail className="size-5" aria-hidden="true" />
              </span>
              szkolenia@iskt.pl
            </li>
            <li className="flex items-center gap-3">
              <span className={IKONA}>
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <span>
                +48 32 000 00 00
                <span className="block text-xs text-muted-foreground">Numer przykładowy</span>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className={IKONA}>
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              Żory, woj. śląskie
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-card p-[clamp(1.75rem,3vw,2.5rem)] shadow-[var(--shadow-md)]">
          <FormularzKontaktu odbiorca={odbiorca} onZmiana={onZmiana} />
        </div>
      </div>
    </section>
  );
}

type PropsFormularza = Props & {
  /** Przedrostek identyfikatorów pól, żeby dwa formularze na stronie nie dzieliły id. */
  prefiks?: string;
  /** Wartość początkowa listy obszarów; zmiana wartości ustawia listę od nowa. */
  obszarPoczatkowy?: string;
  /** Pole „Szkolenie” przed listą obszarów; sekcja strony głównej go nie ma. */
  poleSzkolenia?: PoleSzkolenia;
  /** Wstępna treść pola „Wiadomość” do edycji (okno zapytania na profilu trenera, #41). */
  wiadomoscPoczatkowa?: string | undefined;
};

export type PoleSzkolenia = {
  opcje: { id: string; title: string }[];
  wartosc: string;
  onZmiana: (id: string) => void;
};

/**
 * Formularz kontaktu wspólny dla sekcji strony głównej i okna zapisu (F-02, F-04).
 * Pola są niekontrolowane, a wysyłka jest jawnie zablokowana do czasu podłączenia endpointu.
 */
export function FormularzKontaktu({
  odbiorca,
  onZmiana,
  prefiks = "kontakt",
  obszarPoczatkowy = "",
  poleSzkolenia,
  wiadomoscPoczatkowa,
}: PropsFormularza) {
  const id = (pole: string) => `${prefiks}-${pole}`;
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      noValidate
      className="flex flex-col gap-[var(--space-4)]"
    >
      <PrzelacznikOdbiorcy
        wartosc={odbiorca}
        onZmiana={onZmiana}
        etykiety={{ individual: "Osoba indywidualna", company: "Firma" }}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("imie")} className={ETYKIETA_POLA}>
          Imię i nazwisko
        </label>
        <input
          id={id("imie")}
          name="imie"
          type="text"
          placeholder="Jan Kowalski"
          className={`h-[46px] ${KLASA_POLA}`}
        />
      </div>
      <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("email")} className={ETYKIETA_POLA}>
            E-mail
          </label>
          <input
            id={id("email")}
            name="email"
            type="email"
            placeholder="ty@firma.pl"
            className={`h-[46px] ${KLASA_POLA}`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("telefon")} className={ETYKIETA_POLA}>
            Telefon
          </label>
          <input
            id={id("telefon")}
            name="telefon"
            type="tel"
            placeholder="+48 600 000 000"
            className={`h-[46px] ${KLASA_POLA}`}
          />
        </div>
      </div>
      {poleSzkolenia && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("szkolenie")} className={ETYKIETA_POLA}>
            Szkolenie
          </label>
          <select
            id={id("szkolenie")}
            name="szkolenie"
            value={poleSzkolenia.wartosc}
            onChange={(event) => poleSzkolenia.onZmiana(event.target.value)}
            className={`h-[46px] ${KLASA_POLA}`}
          >
            {poleSzkolenia.opcje.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("obszar")} className={ETYKIETA_POLA}>
          Interesujące szkolenie / obszar
        </label>
        <select
          key={obszarPoczatkowy}
          id={id("obszar")}
          name="obszar"
          defaultValue={obszarPoczatkowy}
          className={`h-[46px] ${KLASA_POLA}`}
        >
          <option value="">Wybierz…</option>
          {OPCJE_OBSZARU.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("wiadomosc")} className={ETYKIETA_POLA}>
          Wiadomość
        </label>
        <textarea
          id={id("wiadomosc")}
          name="wiadomosc"
          rows={3}
          defaultValue={wiadomoscPoczatkowa}
          placeholder="Napisz, czego potrzebujesz…"
          className={`resize-y py-3 ${KLASA_POLA}`}
        />
      </div>
      <div className="flex items-start gap-3">
        <input
          id={id("zgoda")}
          name="zgoda"
          type="checkbox"
          className="mt-1 size-4 accent-[var(--green-700)]"
        />
        <label htmlFor={id("zgoda")} className="text-[13.5px] text-muted-foreground">
          Wyrażam zgodę na kontakt w sprawie zgłoszenia zgodnie z polityką prywatności ISKT
          Greenovation.
        </label>
      </div>
      <Button
        type="submit"
        disabled
        aria-describedby={id("nieaktywny")}
        className="mt-1 h-[54px] w-full rounded-pill bg-primary text-[17px] font-semibold text-primary-foreground shadow-[var(--shadow-brand)]"
      >
        Wyślij zgłoszenie
      </Button>
      <p id={id("nieaktywny")} className="text-center text-[13px] text-muted-foreground">
        Formularz zostanie podłączony w kolejnym etapie.
      </p>
    </form>
  );
}
