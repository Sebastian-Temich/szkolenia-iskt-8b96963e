import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatujKwote } from "@/lib/szkolenia/adapter";
import {
  listaSzkolen,
  publikujSzkolenie,
  usunSzkolenie,
  wycofajSzkolenie,
} from "@/lib/panel/szkolenia-repo";
import { liczPrzypisania, liczbyPrzypisan } from "@/lib/panel/przypisania-repo";
import { AkcjeWiersza, TrescEdycji } from "./AkcjeWiersza";
import { DialogUsuwania } from "./DialogUsuwania";
import { FiltryListy, type FiltrStatusu } from "./FiltryListy";
import { KLUCZE } from "./klucze";
import { BladListy, PlakietkaStatusu, PustaLista, SzkieletListy } from "./StanyListy";
import { useAkcjeTresci } from "./useAkcjeTresci";

/** Lista szkoleń panelu z filtrami, akcjami i czterema stanami. */
export function ListaSzkolen() {
  const [status, setStatus] = useState<FiltrStatusu>("wszystkie");
  const [fraza, setFraza] = useState("");
  const filtr = { status, fraza };
  const lista = useQuery({
    queryKey: KLUCZE.szkolenia(filtr),
    queryFn: () => listaSzkolen(filtr),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const liczby = useQuery({
    queryKey: KLUCZE.liczby("szkolenie"),
    queryFn: () => liczbyPrzypisan("szkolenie"),
    retry: false,
  });
  const akcje = useAkcjeTresci({
    publikuj: publikujSzkolenie,
    wycofaj: wycofajSzkolenie,
    usun: usunSzkolenie,
    liczPrzypisania: (id) => liczPrzypisania("szkolenie", id),
    zamiar: (nazwa, n) => ({
      tytul: `Usunąć szkolenie „${nazwa}”?`,
      skutek: `Usuniesz szkolenie ${nazwa}. Zniknie ${n} przypisań do trenerów. Sami trenerzy zostaną nietknięci.`,
    }),
  });

  return (
    <section aria-labelledby="naglowek-szkolen" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 id="naglowek-szkolen" className="text-3xl font-extrabold tracking-[var(--ls-tight)]">
          Szkolenia
        </h1>
        <Button asChild className="rounded-pill">
          <Link to="/panel/szkolenia/nowe">
            <Plus aria-hidden="true" />
            Dodaj szkolenie
          </Link>
        </Button>
      </div>
      <FiltryListy
        prefiks="szkolenia"
        status={status}
        fraza={fraza}
        onStatus={setStatus}
        onFraza={setFraza}
      />
      {akcje.blad ? (
        <p role="alert" className="rounded-md bg-[var(--error-50)] p-3 text-sm text-destructive">
          {akcje.blad}
        </p>
      ) : null}
      {lista.isPending ? (
        <SzkieletListy etykieta="Wczytujemy listę szkoleń" />
      ) : lista.isError ? (
        <BladListy
          tytul="Nie udało się wczytać listy szkoleń"
          opis="Sprawdź połączenie i spróbuj ponownie."
          ponow={() => void lista.refetch()}
          trwa={lista.isFetching}
        />
      ) : lista.data.length === 0 && status === "wszystkie" && fraza.trim() === "" ? (
        <PustaLista
          tytul="Nie ma jeszcze żadnych szkoleń"
          opis="Dodaj pierwsze szkolenie — zapiszemy je jako szkic, dopóki go nie opublikujesz."
          akcja="Dodaj szkolenie"
          do="/panel/szkolenia/nowe"
        />
      ) : (
        <>
          <p role="status" aria-label="Liczba wyników" className="text-sm text-[var(--text-secondary)]">
            Wyniki: {lista.data.length}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kolejność</TableHead>
                <TableHead>Identyfikator</TableHead>
                <TableHead>Tytuł</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trenerzy</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.sortOrder}</TableCell>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>{s.cat}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatujKwote(s.price)}</TableCell>
                  <TableCell>
                    <PlakietkaStatusu status={s.status} />
                  </TableCell>
                  <TableCell>{liczby.data?.[s.id] ?? 0}</TableCell>
                  <TableCell>
                    <AkcjeWiersza
                      nazwa={s.title}
                      status={s.status}
                      trwa={akcje.trwa}
                      edytuj={
                        <Link to="/panel/szkolenia/$id" params={{ id: s.id }}>
                          <TrescEdycji />
                        </Link>
                      }
                      onPrzelacz={() => void akcje.przelaczStatus(s.id, s.title, s.status)}
                      onUsun={() => void akcje.przygotujUsuniecie(s.id, s.title)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      <DialogUsuwania
        zamiar={akcje.zamiar}
        trwa={akcje.trwa}
        onPotwierdz={(id) => void akcje.potwierdz(id)}
        onAnuluj={akcje.anuluj}
      />
    </section>
  );
}
