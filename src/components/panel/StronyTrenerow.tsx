import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { aktualizujTrenera, pobierzTrenera, utworzTrenera } from "@/lib/panel/trenerzy-repo";
import { listaSzkolen } from "@/lib/panel/szkolenia-repo";
import { odczytajPrzypisania, zapiszPrzypisania } from "@/lib/panel/przypisania-repo";
import type { TrenerPanel } from "@/lib/panel/typy";
import { pustyTrener, trenerNaFormularz } from "@/lib/panel/walidacja";
import { FormularzTrenera } from "./FormularzTrenera";
import { KLUCZE } from "./klucze";
import { useKomunikat } from "./komunikat";
import { BladListy, SzkieletListy } from "./StanyListy";
import { NaglowekStrony, NieZnaleziono } from "./NaglowekStrony";

function useZapisTrenera(edycja: boolean) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pokaz } = useKomunikat();
  return async (model: TrenerPanel, przypisane: string[]) => {
    if (edycja) await aktualizujTrenera(model);
    else await utworzTrenera(model);
    await zapiszPrzypisania("trener", model.id, przypisane);
    await queryClient.invalidateQueries({ queryKey: KLUCZE.wszystko });
    pokaz(`Trener „${model.name}” został zapisany.`);
    await navigate({ to: "/panel/trenerzy" });
  };
}

function useOpcjeSzkolen() {
  return useQuery({
    queryKey: KLUCZE.szkolenia(),
    queryFn: () => listaSzkolen(),
    retry: false,
    select: (lista) => lista.map((s) => ({ id: s.id, etykieta: s.title })),
  });
}

/** Strona dodawania trenera. */
export function NowyTrener() {
  const zapisz = useZapisTrenera(false);
  const szkolenia = useOpcjeSzkolen();
  return (
    <div className="flex flex-col gap-5">
      <NaglowekStrony tytul="Nowy trener" powrot="/panel/trenerzy" />
      {szkolenia.isPending ? (
        <SzkieletListy etykieta="Wczytujemy formularz" />
      ) : szkolenia.isError ? (
        <BladListy
          tytul="Nie udało się wczytać listy szkoleń"
          opis="Spróbuj ponownie za chwilę."
          ponow={() => void szkolenia.refetch()}
          trwa={szkolenia.isFetching}
        />
      ) : (
        <FormularzTrenera
          edycja={false}
          wartosci={pustyTrener()}
          redakcja={{ status: "draft", publishedAt: null }}
          szkolenia={szkolenia.data}
          przypisane={[]}
          onZapisz={zapisz}
        />
      )}
    </div>
  );
}

/** Strona edycji istniejącego trenera. */
export function EdycjaTrenera({ id }: { id: string }) {
  const zapisz = useZapisTrenera(true);
  const szkolenia = useOpcjeSzkolen();
  const trener = useQuery({
    queryKey: KLUCZE.trener(id),
    queryFn: () => pobierzTrenera(id),
    retry: false,
  });
  const przypisane = useQuery({
    queryKey: KLUCZE.przypisania("trener", id),
    queryFn: () => odczytajPrzypisania("trener", id),
    retry: false,
  });
  const zapytania = [trener, przypisane, szkolenia];
  if (zapytania.some((z) => z.isPending)) return <SzkieletListy etykieta="Wczytujemy trenera" />;
  if (zapytania.some((z) => z.isError) || !szkolenia.data || !przypisane.data) {
    return (
      <BladListy
        tytul="Nie udało się wczytać trenera"
        opis="Spróbuj ponownie za chwilę."
        ponow={() => zapytania.forEach((z) => void z.refetch())}
        trwa={zapytania.some((z) => z.isFetching)}
      />
    );
  }
  if (!trener.data)
    return <NieZnaleziono tytul="Nie znaleźliśmy tego trenera" powrot="/panel/trenerzy" />;
  const t = trener.data;
  return (
    <div className="flex flex-col gap-5">
      <NaglowekStrony tytul={`Edycja: ${t.name}`} powrot="/panel/trenerzy" />
      <FormularzTrenera
        key={t.id}
        edycja
        wartosci={trenerNaFormularz(t)}
        redakcja={{ status: t.status, publishedAt: t.publishedAt }}
        szkolenia={szkolenia.data}
        przypisane={przypisane.data}
        onZapisz={zapisz}
      />
    </div>
  );
}
