import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { stanKonfiguracji } from "@/lib/supabase/klient";
import {
  biezacaSesja,
  nasluchujSesji,
  pobierzRole,
  wyloguj,
  type SesjaPanelu,
} from "@/lib/panel/sesja";
import type { RolaPanelu } from "@/lib/panel/typy";
import { BrakUprawnien, PanelNieSkonfigurowany, SprawdzanieUprawnien } from "./EkranyDostepu";
import { FormularzLogowania } from "./FormularzLogowania";
import { KLUCZE } from "./klucze";

/** Dane zalogowanego redaktora przekazywane do układu panelu. */
export type KontekstRedaktora = { email: string; role: RolaPanelu[]; wyloguj: () => void };

type Stan =
  | { typ: "sprawdzanie" }
  | { typ: "anonim" }
  | { typ: "bez-roli"; email: string }
  | { typ: "redaktor"; email: string; role: RolaPanelu[] };

/*
 * UWAGA: ukrycie elementów UI nie jest kontrolą dostępu. Bramka tylko dobiera widok;
 * autoryzację każdej operacji egzekwują polityki RLS w bazie.
 */

/** Bramka całej trasy /panel: konfiguracja, sesja, logowanie, role, panel. */
export function BramkaDostepu({ children }: { children: (r: KontekstRedaktora) => ReactNode }) {
  const konfiguracja = stanKonfiguracji();
  if (!konfiguracja.ok) return <PanelNieSkonfigurowany powod={konfiguracja.powod} />;
  return <BramkaSesji>{children}</BramkaSesji>;
}

function BramkaSesji({ children }: { children: (r: KontekstRedaktora) => ReactNode }) {
  const [stan, setStan] = useState<Stan>({ typ: "sprawdzanie" });
  const queryClient = useQueryClient();
  const wersja = useRef(0);

  const ocenSesje = useCallback(async (sesja: SesjaPanelu | null) => {
    const moja = ++wersja.current;
    if (!sesja) {
      setStan({ typ: "anonim" });
      return;
    }
    setStan({ typ: "sprawdzanie" });
    let role: RolaPanelu[] = [];
    try {
      role = await pobierzRole();
    } catch {
      role = [];
    }
    if (moja !== wersja.current) return;
    setStan(
      role.length > 0
        ? { typ: "redaktor", email: sesja.email, role }
        : { typ: "bez-roli", email: sesja.email },
    );
  }, []);

  useEffect(() => {
    let aktywny = true;
    void biezacaSesja().then((s) => {
      if (aktywny) void ocenSesje(s);
    });
    const wylacz = nasluchujSesji((s) => {
      if (!s && aktywny) {
        wersja.current++;
        setStan({ typ: "anonim" });
      }
    });
    return () => {
      aktywny = false;
      wylacz();
    };
  }, [ocenSesje]);

  const wylogujSie = useCallback(() => {
    wersja.current++;
    queryClient.removeQueries({ queryKey: KLUCZE.wszystko });
    setStan({ typ: "anonim" });
    void wyloguj();
  }, [queryClient]);

  switch (stan.typ) {
    case "sprawdzanie":
      return <SprawdzanieUprawnien />;
    case "anonim":
      return <FormularzLogowania onZalogowano={(s) => void ocenSesje(s)} />;
    case "bez-roli":
      return <BrakUprawnien email={stan.email} onWyloguj={wylogujSie} />;
    case "redaktor":
      return <>{children({ email: stan.email, role: stan.role, wyloguj: wylogujSie })}</>;
  }
}
