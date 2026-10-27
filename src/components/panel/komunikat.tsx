import { useCallback, useState, type ReactNode } from "react";
import { KontekstKomunikatu } from "./komunikat-kontekst";

/** Przechowuje komunikat sukcesu, który przetrwa powrót z formularza na listę. */
export function DostawcaKomunikatu({ children }: { children: ReactNode }) {
  const [tresc, setTresc] = useState<string | null>(null);
  const pokaz = useCallback((t: string) => setTresc(t), []);
  return (
    <KontekstKomunikatu.Provider value={{ pokaz, tresc }}>{children}</KontekstKomunikatu.Provider>
  );
}
