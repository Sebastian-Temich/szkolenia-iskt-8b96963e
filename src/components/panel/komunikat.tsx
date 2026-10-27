import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Komunikat = { pokaz: (tresc: string) => void; tresc: string | null };

const KontekstKomunikatu = createContext<Komunikat>({ pokaz: () => {}, tresc: null });

/** Przechowuje komunikat sukcesu, który przetrwa powrót z formularza na listę. */
export function DostawcaKomunikatu({ children }: { children: ReactNode }) {
  const [tresc, setTresc] = useState<string | null>(null);
  const pokaz = useCallback((t: string) => setTresc(t), []);
  return (
    <KontekstKomunikatu.Provider value={{ pokaz, tresc }}>{children}</KontekstKomunikatu.Provider>
  );
}

/** Dostęp do komunikatu sukcesu panelu. */
export function useKomunikat(): Komunikat {
  return useContext(KontekstKomunikatu);
}
