import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/brand/Eyebrow";
import {
  KOMUNIKATY_POL,
  POLE_PULAPKI,
  waliduj,
  type PoleFormularza,
  type Zrodlo,
} from "@/lib/zgloszenia/schemat";
import { wyslijZgloszenie } from "@/lib/zgloszenia/wyslij";
import { PrzelacznikOdbiorcy } from "./PrzelacznikOdbiorcy";
import { OPCJE_OBSZARU, TEKSTY_WYSYLKI, trescKontaktu, type Odbiorca } from "./tresci";

const ETYKIETA_POLA = "text-[13.5px] font-semibold text-[var(--ink-800)]";
const KLASA_POLA =
  "rounded-md border border-[var(--border-default)] bg-background px-[14px] text-[15px] text-foreground outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]";
const IKONA =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--green-50)] text-primary";

type Props = { odbiorca: Odbiorca; onZmiana: (o: Odbiorca) => void };

/** Renderuje dane kontaktowe i formularz zgłoszenia wysyłany do biura (W-12, źródło `kontakt`). */
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
  /** Miejsce formularza (W-12, pole `zrodlo`): ustawia je aplikacja, nie użytkownik. */
  zrodlo?: Zrodlo;
  /** Przedrostek identyfikatorów pól, żeby dwa formularze na stronie nie dzieliły id. */
  prefiks?: string;
  /** Wartość początkowa listy obszarów; zmiana wartości ustawia listę od nowa. */
  obszarPoczatkowy?: string;
  /** Pole „Szkolenie” przed listą obszarów; sekcja strony głównej go nie ma. */
  poleSzkolenia?: PoleSzkolenia;
  /** Wstępna treść pola „Wiadomość” do edycji (okno zapytania na profilu trenera, #41). */
  wiadomoscPoczatkowa?: string | undefined;
  /** Dodatkowa akcja pod podziękowaniem (w oknie: przycisk „Zamknij”). */
  akcjaPoSukcesie?: ReactNode;
};

export type PoleSzkolenia = {
  opcje: { id: string; title: string }[];
  wartosc: string;
  onZmiana: (id: string) => void;
};

type Stan = "edycja" | "wysylanie" | "sukces" | "bledne" | "blad" | "limit";
type Bledy = Partial<Record<PoleFormularza, string>>;

const KOMUNIKAT_STANU: Partial<Record<Stan, string>> = {
  wysylanie: TEKSTY_WYSYLKI.wysylam,
  bledne: TEKSTY_WYSYLKI.bladDanych,
  blad: TEKSTY_WYSYLKI.bladSerwera,
  limit: TEKSTY_WYSYLKI.limit,
};

const tekst = (wartosc: FormDataEntryValue | null) => (typeof wartosc === "string" ? wartosc : "");

/**
 * Formularz kontaktu wspólny dla sekcji strony głównej, okna zapisu i okna z profilu trenera
 * (F-02, F-04, W-12). Pola są niekontrolowane, więc po błędzie wpisane dane zostają. Wysyłka
 * przez funkcję serwerową `wyslijZgloszenie` po walidacji tym samym schematem co na serwerze.
 */
export function FormularzKontaktu({
  odbiorca,
  onZmiana,
  zrodlo = "kontakt",
  prefiks = "kontakt",
  obszarPoczatkowy = "",
  poleSzkolenia,
  wiadomoscPoczatkowa,
  akcjaPoSukcesie,
}: PropsFormularza) {
  const id = (pole: string) => `${prefiks}-${pole}`;
  const [stan, setStan] = useState<Stan>("edycja");
  const [bledy, setBledy] = useState<Bledy>({});
  const trwa = useRef(false);
  const podziekowanie = useRef<HTMLHeadingElement>(null);
  // Review PR #49: SSR renderuje przycisk wyłączony; włącza go dopiero kod w przeglądarce po
  // hydratacji. Bez JavaScriptu (i przed hydratacją) formularz nie wysyła się natywnie.
  const [aktywny, setAktywny] = useState(false);

  useEffect(() => setAktywny(true), []);

  useEffect(() => {
    if (stan === "sukces") podziekowanie.current?.focus();
  }, [stan]);

  const pokazBledy = (formularz: HTMLFormElement, pola: PoleFormularza[]) => {
    setBledy(Object.fromEntries(pola.map((p) => [p, KOMUNIKATY_POL[p]])));
    setStan("bledne");
    const pierwsze = pola[0] && formularz.elements.namedItem(pola[0]);
    if (pierwsze instanceof HTMLElement) pierwsze.focus();
  };

  const wyslij = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trwa.current) return;
    const formularz = event.currentTarget;
    const pola = new FormData(formularz);
    const wybrane = poleSzkolenia?.opcje.find((s) => s.id && s.id === poleSzkolenia.wartosc);
    const dane = {
      zrodlo,
      odbiorca,
      imie: tekst(pola.get("imie")),
      email: tekst(pola.get("email")),
      telefon: tekst(pola.get("telefon")),
      szkolenie: poleSzkolenia ? poleSzkolenia.wartosc : undefined,
      szkolenieTytul: wybrane?.title,
      obszar: tekst(pola.get("obszar")),
      wiadomosc: tekst(pola.get("wiadomosc")),
      zgoda: pola.get("zgoda") === "on",
      strona: window.location.pathname,
      [POLE_PULAPKI]: tekst(pola.get(POLE_PULAPKI)),
    };
    const walidacja = waliduj(dane);
    if (!walidacja.ok && walidacja.pola.length > 0) {
      pokazBledy(formularz, walidacja.pola);
      return;
    }

    trwa.current = true;
    setBledy({});
    setStan("wysylanie");
    try {
      const wynik = await wyslijZgloszenie({ data: dane });
      if (wynik.wynik === "walidacja" && wynik.pola.length > 0) pokazBledy(formularz, wynik.pola);
      else if (wynik.wynik === "ok") setStan("sukces");
      else if (wynik.wynik === "limit") setStan("limit");
      else setStan("blad");
    } catch {
      setStan("blad");
    } finally {
      trwa.current = false;
    }
  };

  if (stan === "sukces") {
    return (
      <div className="flex flex-col gap-[var(--space-3)]" role="status" aria-live="polite">
        <h3
          ref={podziekowanie}
          tabIndex={-1}
          className="text-[clamp(1.5rem,3vw,1.9rem)] font-extrabold leading-[1.15] tracking-[var(--ls-tight)] outline-none"
        >
          {TEKSTY_WYSYLKI.sukcesNaglowek}
        </h3>
        <p className="text-muted-foreground">{TEKSTY_WYSYLKI.sukcesTekst}</p>
        {akcjaPoSukcesie}
      </div>
    );
  }

  /** Atrybuty pola z błędem: `aria-invalid` i opis komunikatem przy polu (W-12, „Dostępność”). */
  const aria = (pole: PoleFormularza) =>
    bledy[pole] ? { "aria-invalid": true as const, "aria-describedby": id(`${pole}-blad`) } : {};
  const komunikat = (pole: PoleFormularza) =>
    bledy[pole] ? (
      <p id={id(`${pole}-blad`)} className="text-[13px] font-medium text-destructive">
        {bledy[pole]}
      </p>
    ) : null;
  const wysylanie = stan === "wysylanie";
  const komunikatStanu = KOMUNIKAT_STANU[stan];

  return (
    <form
      // `post` bez `action`: gdyby formularz mimo wszystko wysłał się natywnie, dane idą w treści
      // żądania, nigdy w adresie, historii przeglądarki ani logach adresów (review PR #49).
      method="post"
      onSubmit={(event) => void wyslij(event)}
      noValidate
      aria-busy={wysylanie}
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
          autoComplete="name"
          placeholder="Jan Kowalski"
          className={`h-[46px] ${KLASA_POLA}`}
          {...aria("imie")}
        />
        {komunikat("imie")}
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
            autoComplete="email"
            placeholder="ty@firma.pl"
            className={`h-[46px] ${KLASA_POLA}`}
            {...aria("email")}
          />
          {komunikat("email")}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("telefon")} className={ETYKIETA_POLA}>
            Telefon
          </label>
          <input
            id={id("telefon")}
            name="telefon"
            type="tel"
            autoComplete="tel"
            placeholder="+48 600 000 000"
            className={`h-[46px] ${KLASA_POLA}`}
            {...aria("telefon")}
          />
          {komunikat("telefon")}
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
            {...aria("szkolenie")}
          >
            {poleSzkolenia.opcje.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          {komunikat("szkolenie")}
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
          {...aria("obszar")}
        >
          <option value="">Wybierz…</option>
          {OPCJE_OBSZARU.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {komunikat("obszar")}
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
          {...aria("wiadomosc")}
        />
        {komunikat("wiadomosc")}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-3">
          <input
            id={id("zgoda")}
            name="zgoda"
            type="checkbox"
            className="mt-1 size-4 accent-[var(--green-700)]"
            {...aria("zgoda")}
          />
          <label htmlFor={id("zgoda")} className="text-[13.5px] text-muted-foreground">
            Wyrażam zgodę na kontakt w sprawie zgłoszenia zgodnie z polityką prywatności ISKT
            Greenovation.
          </label>
        </div>
        {komunikat("zgoda")}
      </div>
      {/* Pole-pułapka (R8): poza ekranem i poza drzewem dostępności, bez fokusu z klawiatury. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor={id(POLE_PULAPKI)}>Strona www</label>
        <input
          id={id(POLE_PULAPKI)}
          name={POLE_PULAPKI}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <p
        role="status"
        aria-live="polite"
        className={
          stan === "wysylanie" || stan === "edycja"
            ? "sr-only"
            : "text-[13.5px] font-medium text-destructive"
        }
      >
        {komunikatStanu}
      </p>
      <Button
        type="submit"
        disabled={!aktywny || wysylanie}
        className="mt-1 h-[54px] w-full rounded-pill bg-primary text-[17px] font-semibold text-primary-foreground shadow-[var(--shadow-brand)]"
      >
        {wysylanie ? TEKSTY_WYSYLKI.wysylam : "Wyślij zgłoszenie"}
      </Button>
      {/* E-001: zamiast <noscript> (strumieniowy SSR wysyłał go pusty) zwykły akapit w HTML z
          serwera, usuwany po hydratacji razem z odblokowaniem przycisku. Bez JS zostaje widoczny. */}
      {!aktywny && (
        <p className="text-center text-[13px] text-muted-foreground">{TEKSTY_WYSYLKI.bezSkryptu}</p>
      )}
    </form>
  );
}
