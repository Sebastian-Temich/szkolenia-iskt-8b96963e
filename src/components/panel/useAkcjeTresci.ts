import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { komunikatBledu } from "@/lib/panel/bledy";
import type { StatusTresci } from "@/lib/panel/typy";
import type { ZamiarUsuniecia } from "./DialogUsuwania";
import { KLUCZE } from "./klucze";
import { useKomunikat } from "./komunikat-kontekst";

type Operacje = {
  publikuj: (id: string) => Promise<void>;
  wycofaj: (id: string) => Promise<void>;
  usun: (id: string) => Promise<void>;
  liczPrzypisania: (id: string) => Promise<number>;
  zamiar: (nazwa: string, liczba: number) => Omit<ZamiarUsuniecia, "id">;
};

/** Publikacja, wycofanie i usuwanie wpisów listy z odświeżeniem zapytań panelu. */
export function useAkcjeTresci(op: Operacje) {
  const queryClient = useQueryClient();
  const { pokaz } = useKomunikat();
  const [zamiar, setZamiar] = useState<ZamiarUsuniecia | null>(null);
  const [trwa, setTrwa] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  async function wykonaj(dzialanie: () => Promise<void>, sukces: string, poSukcesie?: () => void) {
    setTrwa(true);
    setBlad(null);
    try {
      await dzialanie();
      poSukcesie?.();
      pokaz(sukces);
      await queryClient.invalidateQueries({ queryKey: KLUCZE.wszystko });
      return true;
    } catch (e) {
      setBlad(komunikatBledu(e, "Nie udało się wykonać operacji. Spróbuj ponownie."));
      return false;
    } finally {
      setTrwa(false);
    }
  }

  return {
    trwa,
    blad,
    zamiar,
    przelaczStatus: (id: string, nazwa: string, status: StatusTresci) =>
      status === "published"
        ? wykonaj(() => op.wycofaj(id), `„${nazwa}” wycofane do szkicu.`)
        : wykonaj(() => op.publikuj(id), `„${nazwa}” opublikowane.`),
    przygotujUsuniecie: async (id: string, nazwa: string) => {
      setBlad(null);
      try {
        const liczba = await op.liczPrzypisania(id);
        setZamiar({ id, ...op.zamiar(nazwa, liczba) });
      } catch (e) {
        setBlad(komunikatBledu(e, "Nie udało się sprawdzić przypisań. Spróbuj ponownie."));
      }
    },
    anuluj: () => setZamiar(null),
    potwierdz: async (id: string) => {
      if (await wykonaj(() => op.usun(id), "Wpis został usunięty.")) {
        setZamiar(null);
      }
    },
  };
}
