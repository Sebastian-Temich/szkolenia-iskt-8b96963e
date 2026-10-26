import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./Eyebrow";
import { PrzelacznikOdbiorcy } from "./PrzelacznikOdbiorcy";
import { OPCJE_OBSZARU, trescKontaktu, type Odbiorca } from "./tresci";

const ETYKIETA = "text-[13.5px] font-semibold text-[var(--ink-800)]";
const POLE =
  "rounded-md border border-[var(--border-default)] bg-background px-[14px] text-[15px] text-foreground outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]";
const IKONA =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--green-50)] text-primary";

type Props = { odbiorca: Odbiorca; onZmiana: (o: Odbiorca) => void };

/** Renders contact details and the visual-only, not yet connected contact form. */
export function SekcjaKontakt({ odbiorca, onZmiana }: Props) {
  const tresc = trescKontaktu(odbiorca);
  return (
    <section
      id="kontakt"
      aria-labelledby="kontakt-naglowek"
      className="scroll-mt-[calc(var(--space-16)+var(--space-6))] bg-[var(--surface-muted)] py-[var(--section-pad-y)]"
    >
      <div className="mx-auto grid max-w-[var(--container-max)] items-start gap-[clamp(2rem,4vw,4rem)] px-[var(--container-pad)] lg:grid-cols-[0.9fr_1.1fr]">
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
              <label htmlFor="kontakt-imie" className={ETYKIETA}>
                Imię i nazwisko
              </label>
              <input
                id="kontakt-imie"
                name="imie"
                type="text"
                placeholder="Jan Kowalski"
                className={`h-[46px] ${POLE}`}
              />
            </div>
            <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kontakt-email" className={ETYKIETA}>
                  E-mail
                </label>
                <input
                  id="kontakt-email"
                  name="email"
                  type="email"
                  placeholder="ty@firma.pl"
                  className={`h-[46px] ${POLE}`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kontakt-telefon" className={ETYKIETA}>
                  Telefon
                </label>
                <input
                  id="kontakt-telefon"
                  name="telefon"
                  type="tel"
                  placeholder="+48 600 000 000"
                  className={`h-[46px] ${POLE}`}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kontakt-obszar" className={ETYKIETA}>
                Interesujące szkolenie / obszar
              </label>
              <select
                id="kontakt-obszar"
                name="obszar"
                defaultValue=""
                className={`h-[46px] ${POLE}`}
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
              <label htmlFor="kontakt-wiadomosc" className={ETYKIETA}>
                Wiadomość
              </label>
              <textarea
                id="kontakt-wiadomosc"
                name="wiadomosc"
                rows={3}
                placeholder="Napisz, czego potrzebujesz…"
                className={`resize-y py-3 ${POLE}`}
              />
            </div>
            <div className="flex items-start gap-3">
              <input
                id="kontakt-zgoda"
                name="zgoda"
                type="checkbox"
                className="mt-1 size-4 accent-[var(--green-700)]"
              />
              <label htmlFor="kontakt-zgoda" className="text-[13.5px] text-muted-foreground">
                Wyrażam zgodę na kontakt w sprawie zgłoszenia zgodnie z polityką prywatności ISKT
                Greenovation.
              </label>
            </div>
            <Button
              type="submit"
              disabled
              aria-describedby="formularz-nieaktywny"
              className="mt-1 h-[54px] w-full rounded-pill bg-primary text-[17px] font-semibold text-primary-foreground shadow-[var(--shadow-brand)]"
            >
              Wyślij zgłoszenie
            </Button>
            <p id="formularz-nieaktywny" className="text-center text-[13px] text-muted-foreground">
              Formularz zostanie podłączony w kolejnym etapie.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
