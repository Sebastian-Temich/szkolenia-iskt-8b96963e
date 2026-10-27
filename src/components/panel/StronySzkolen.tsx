import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { aktualizujSzkolenie, pobierzSzkolenie, utworzSzkolenie } from "@/lib/panel/szkolenia-repo";
import { listaTrenerow } from "@/lib/panel/trenerzy-repo";
import { odczytajPrzypisania, zapiszPrzypisania } from "@/lib/panel/przypisania-repo";
import type { SzkoleniePanel } from "@/lib/panel/typy";
import { pusteSzkolenie, szkolenieNaFormularz } from "@/lib/panel/walidacja";
import { FormularzSzkolenia } from "./FormularzSzkolenia";
import { KLUCZE } from "./klucze";
import { useKomunikat } from "./komunikat";
import { BladListy, SzkieletListy } from "./StanyListy";
import { NaglowekStrony, NieZnaleziono } from "./NaglowekStrony";

function useZapisSzkolenia(edycja: boolean) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pokaz } = useKomunikat();
  return async (model: SzkoleniePanel, przypisani: string[]) => {
    if (edycja) await aktualizujSzkolenie(model);
    else await utworzSzkolenie(model);
    await zapiszPrzypisania("szkolenie", model.id, przypisani);
    await queryClient.invalidateQueries({ queryKey: KLUCZE.wszystko });
    pokaz(`Szkolenie „${model.title}” zostało zapisane.`);
    await navigate({ to: "/panel/szkolenia" });
  };
}

function useOpcjeTrenerow() {
  return useQuery({
    queryKey: KLUCZE.trenerzy(),
    queryFn: () => listaTrenerow(),
    retry: false,
    select: (lista) => lista.map((t) => ({ id: t.id, etykieta: t.name })),
  });
}

/** Strona dodawania szkolenia. */
export function NoweSzkolenie() {
  const zapisz = useZapisSzkolenia(false);
  const trenerzy = useOpcjeTrenerow();
  return (
    <div className="flex flex-col gap-5">
      <NaglowekStrony tytul="Nowe szkolenie" powrot="/panel/szkolenia" />
      {trenerzy.isPending ? (
        <SzkieletListy etykieta="Wczytujemy formularz" />
      ) : trenerzy.isError ? (
        <BladListy
          tytul="Nie udało się wczytać listy trenerów"
          opis="Spróbuj ponownie za chwilę."
          ponow={() => void trenerzy.refetch()}
          trwa={trenerzy.isFetching}
        />
      ) : (
        <FormularzSzkolenia
          edycja={false}
          wartosci={pusteSzkolenie()}
          redakcja={{ status: "draft", publishedAt: null }}
          trenerzy={trenerzy.data}
          przypisani={[]}
          onZapisz={zapisz}
        />
      )}
    </div>
  );
}

/** Strona edycji istniejącego szkolenia. */
export function EdycjaSzkolenia({ id }: { id: string }) {
  const zapisz = useZapisSzkolenia(true);
  const trenerzy = useOpcjeTrenerow();
  const szkolenie = useQuery({
    queryKey: KLUCZE.szkolenie(id),
    queryFn: () => pobierzSzkolenie(id),
    retry: false,
  });
  const przypisani = useQuery({
    queryKey: KLUCZE.przypisania("szkolenie", id),
    queryFn: () => odczytajPrzypisania("szkolenie", id),
    retry: false,
  });
  const zapytania = [szkolenie, przypisani, trenerzy];
  if (zapytania.some((z) => z.isPending)) {
    return <SzkieletListy etykieta="Wczytujemy szkolenie" />;
  }
  if (zapytania.some((z) => z.isError) || !trenerzy.data || !przypisani.data) {
    return (
      <BladListy
        tytul="Nie udało się wczytać szkolenia"
        opis="Spróbuj ponownie za chwilę."
        ponow={() => zapytania.forEach((z) => void z.refetch())}
        trwa={zapytania.some((z) => z.isFetching)}
      />
    );
  }
  if (!szkolenie.data)
    return <NieZnaleziono tytul="Nie znaleźliśmy tego szkolenia" powrot="/panel/szkolenia" />;
  const s = szkolenie.data;
  return (
    <div className="flex flex-col gap-5">
      <NaglowekStrony tytul={`Edycja: ${s.title}`} powrot="/panel/szkolenia" />
      <FormularzSzkolenia
        key={s.id}
        edycja
        wartosci={szkolenieNaFormularz(s)}
        redakcja={{ status: s.status, publishedAt: s.publishedAt }}
        trenerzy={trenerzy.data}
        przypisani={przypisani.data}
        onZapisz={zapisz}
      />
    </div>
  );
}
