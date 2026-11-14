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
import { useIsMobile } from "@/hooks/use-mobile";
import type { StatusTresci } from "@/lib/panel/typy";
import {
  listaTrenerow,
  publikujTrenera,
  usunTrenera,
  wycofajTrenera,
} from "@/lib/panel/trenerzy-repo";
import { liczPrzypisania, liczbyPrzypisan } from "@/lib/panel/przypisania-repo";
import { AkcjeWiersza, TrescEdycji } from "./AkcjeWiersza";
import { DialogUsuwania } from "./DialogUsuwania";
import { FiltryListy, type FiltrStatusu } from "./FiltryListy";
import { KartaPozycji, ListaKart } from "./KartyListy";
import { KLUCZE } from "./klucze";
import { BladListy, PlakietkaStatusu, PustaLista, SzkieletListy } from "./StanyListy";
import { useAkcjeTresci } from "./useAkcjeTresci";

/** Lista trenerów panelu z filtrami, akcjami i czterema stanami. */
export function ListaTrenerow() {
  const [status, setStatus] = useState<FiltrStatusu>("wszystkie");
  const [fraza, setFraza] = useState("");
  const filtr = { status, fraza };
  const lista = useQuery({
    queryKey: KLUCZE.trenerzy(filtr),
    queryFn: () => listaTrenerow(filtr),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const liczby = useQuery({
    queryKey: KLUCZE.liczby("trener"),
    queryFn: () => liczbyPrzypisan("trener"),
    retry: false,
  });
  const akcje = useAkcjeTresci({
    publikuj: publikujTrenera,
    wycofaj: wycofajTrenera,
    usun: usunTrenera,
    liczPrzypisania: (id) => liczPrzypisania("trener", id),
    zamiar: (nazwa, n) => ({
      tytul: `Usunąć trenera „${nazwa}”?`,
      skutek: `Usuniesz trenera ${nazwa}. Zniknie ${n} przypisań do szkoleń. Same szkolenia zostaną nietknięte.`,
    }),
  });
  const telefon = useIsMobile();
  const akcjeDla = (t: { id: string; name: string; status: StatusTresci }, karta: boolean) => (
    <AkcjeWiersza
      nazwa={t.name}
      status={t.status}
      trwa={akcje.trwa}
      karta={karta}
      edytuj={
        <Link to="/panel/trenerzy/$id" params={{ id: t.id }}>
          <TrescEdycji />
        </Link>
      }
      onPrzelacz={() => void akcje.przelaczStatus(t.id, t.name, t.status)}
      onUsun={() => void akcje.przygotujUsuniecie(t.id, t.name)}
    />
  );

  return (
    <section aria-labelledby="naglowek-trenerow" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 id="naglowek-trenerow" className="text-3xl font-extrabold tracking-[var(--ls-tight)]">
          Trenerzy
        </h1>
        <Button asChild className="rounded-pill">
          <Link to="/panel/trenerzy/nowy">
            <Plus aria-hidden="true" />
            Dodaj trenera
          </Link>
        </Button>
      </div>
      <FiltryListy
        prefiks="trenerzy"
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
        <SzkieletListy etykieta="Wczytujemy listę trenerów" />
      ) : lista.isError ? (
        <BladListy
          tytul="Nie udało się wczytać listy trenerów"
          opis="Sprawdź połączenie i spróbuj ponownie."
          ponow={() => void lista.refetch()}
          trwa={lista.isFetching}
        />
      ) : lista.data.length === 0 && status === "wszystkie" && fraza.trim() === "" ? (
        <PustaLista
          tytul="Nie ma jeszcze żadnych trenerów"
          opis="Dodaj pierwszego trenera — zapiszemy go jako szkic, dopóki go nie opublikujesz."
          akcja="Dodaj trenera"
          do="/panel/trenerzy/nowy"
        />
      ) : (
        <>
          <p
            role="status"
            aria-label="Liczba wyników"
            className="text-sm text-[var(--text-secondary)]"
          >
            Wyniki: {lista.data.length}
          </p>
          {telefon ? (
            <ListaKart etykieta="Lista trenerów">
              {lista.data.map((t) => (
                <KartaPozycji
                  key={t.id}
                  tytul={t.name}
                  pola={[
                    { etykieta: "Kolejność", wartosc: t.sortOrder },
                    { etykieta: "Identyfikator", wartosc: t.id, klasa: "font-mono text-xs" },
                    { etykieta: "Rola", wartosc: t.role },
                    { etykieta: "Obszary", wartosc: t.areas.join(", ") },
                    { etykieta: "Status", wartosc: <PlakietkaStatusu status={t.status} /> },
                    { etykieta: "Szkolenia", wartosc: liczby.data?.[t.id] ?? 0 },
                  ]}
                  akcje={akcjeDla(t, true)}
                />
              ))}
            </ListaKart>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kolejność</TableHead>
                  <TableHead>Identyfikator</TableHead>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Obszary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Szkolenia</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.sortOrder}</TableCell>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.role}</TableCell>
                    <TableCell>{t.areas.join(", ")}</TableCell>
                    <TableCell>
                      <PlakietkaStatusu status={t.status} />
                    </TableCell>
                    <TableCell>{liczby.data?.[t.id] ?? 0}</TableCell>
                    <TableCell>{akcjeDla(t, false)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
