import { createContext, useContext } from "react";

type Komunikat = { pokaz: (tresc: string) => void; tresc: string | null };

export const KontekstKomunikatu = createContext<Komunikat>({ pokaz: () => {}, tresc: null });

/** Dostęp do komunikatu sukcesu panelu. */
export function useKomunikat(): Komunikat {
  return useContext(KontekstKomunikatu);
}
