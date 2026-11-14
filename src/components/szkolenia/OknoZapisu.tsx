import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormularzKontaktu } from "@/components/strona-glowna/SekcjaKontakt";
import {
  OBSZAR_SZKOLENIE_ZAMKNIETE,
  TYTULY_OKNA_ZAPISU,
  type Odbiorca,
} from "@/components/strona-glowna/tresci";
import { listSzkolenia, type Szkolenie } from "@/lib/szkolenia/adapter";

type Props = {
  /**
   * Szkolenie wybrane na starcie. Bez niego (profil trenera z żadnym albo kilkoma szkoleniami,
   * #41) pole „Szkolenie” zaczyna od pustej pozycji „Wybierz…”.
   */
  szkolenie?: Szkolenie | undefined;
  /** Wariant, w którym okno się otwiera; gość może go przełączyć w formularzu. */
  wariant: Odbiorca;
  /** Opis pod tytułem okna; domyślnie tytuł szkolenia. */
  opis?: string;
  /** Wstępna treść pola „Wiadomość”, do edycji. */
  wiadomoscPoczatkowa?: string | undefined;
  /** Przycisk otwierający okno; po zamknięciu fokus wraca na niego. */
  children: ReactNode;
};

/** Wartość pustej pozycji pola „Szkolenie”. */
const BEZ_WYBORU = "";

/**
 * Okno zapisu (F-04, issue #18) na stronie szkolenia i okno zapytania na profilu trenera
 * (F-05, issue #41): formularz kontaktu z polem „Szkolenie”. Adres strony się nie zmienia, a
 * wysyłka jest zablokowana jak w formularzu strony głównej (F-02).
 */
export function OknoZapisu({ szkolenie, wariant, opis, wiadomoscPoczatkowa, children }: Props) {
  const domyslne = szkolenie?.id ?? BEZ_WYBORU;
  const [otwarte, setOtwarte] = useState(false);
  const [odbiorca, setOdbiorca] = useState<Odbiorca>(wariant);
  const [wybrane, setWybrane] = useState(domyslne);
  // Listę pobieramy dopiero po otwarciu okna, żeby strona nie płaciła za nią z góry.
  const lista = useQuery({
    queryKey: ["szkolenia", "okno-zapisu"],
    queryFn: () => listSzkolenia(),
    enabled: otwarte,
  });
  // Przy błędzie (także odświeżenia po wcześniejszym sukcesie) React Query trzyma stare dane;
  // wtedy pole ma wyłącznie pozycję startową, a wybór wraca do niej.
  const opcje = opcjeSzkolen(szkolenie, lista.isError ? undefined : lista.data);
  const wartosc = opcje.some((s) => s.id === wybrane) ? wybrane : domyslne;

  const zmienOtwarcie = (stan: boolean) => {
    if (stan) {
      setOdbiorca(wariant);
      setWybrane(domyslne);
    }
    setOtwarte(stan);
  };

  return (
    <Dialog open={otwarte} onOpenChange={zmienOtwarcie}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="grid-cols-1 max-h-[100dvh] max-w-[var(--container-max)] overflow-y-auto rounded-none border-[var(--border-subtle)] bg-card p-[clamp(1.25rem,3vw,2.5rem)] shadow-[var(--shadow-md)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl sm:rounded-lg">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-[clamp(1.5rem,3vw,1.9rem)] font-extrabold leading-[1.15] tracking-[var(--ls-tight)]">
            {TYTULY_OKNA_ZAPISU[odbiorca]}
          </DialogTitle>
          <DialogDescription>{opis ?? szkolenie?.title}</DialogDescription>
        </DialogHeader>
        <FormularzKontaktu
          prefiks={`zapis-${wariant}`}
          odbiorca={odbiorca}
          onZmiana={setOdbiorca}
          obszarPoczatkowy={odbiorca === "company" ? OBSZAR_SZKOLENIE_ZAMKNIETE : ""}
          poleSzkolenia={{ opcje, wartosc, onZmiana: setWybrane }}
          wiadomoscPoczatkowa={wiadomoscPoczatkowa}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Opublikowane szkolenia do wyboru. Bez listy (ładowanie albo błąd) zostaje sama pozycja
 * startowa (bieżące szkolenie albo „Wybierz…”), żeby pole nigdy nie było puste ani nie traciło
 * wyboru.
 */
function opcjeSzkolen(biezace: Szkolenie | undefined, lista: Szkolenie[] | undefined) {
  const opcje = (lista ?? []).map((s) => ({ id: s.id, title: s.title }));
  if (!biezace) return [{ id: BEZ_WYBORU, title: "Wybierz…" }, ...opcje];
  return opcje.some((s) => s.id === biezace.id)
    ? opcje
    : [{ id: biezace.id, title: biezace.title }, ...opcje];
}
