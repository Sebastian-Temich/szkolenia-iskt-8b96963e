import type { ReactNode } from "react";
import { LogOut, Settings2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Wyśrodkowana karta ekranów dostępu z jedynym nagłówkiem h1. */
export function KartaDostepu({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-[var(--container-pad)] py-[var(--section-pad-y)]">
      <div className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-8 shadow-[var(--shadow-md)]">
        {children}
      </div>
    </div>
  );
}

/** Ekran braku konfiguracji połączenia z bazą. */
export function PanelNieSkonfigurowany({ powod }: { powod: string }) {
  return (
    <KartaDostepu>
      <Settings2 className="size-8 text-primary" aria-hidden="true" />
      <h1 className="text-2xl font-extrabold tracking-[var(--ls-tight)]">
        Panel nie jest skonfigurowany
      </h1>
      <p className="text-[15px] text-[var(--text-secondary)]">{powod}</p>
    </KartaDostepu>
  );
}

/** Stan sprawdzania sesji i uprawnień. */
export function SprawdzanieUprawnien() {
  return (
    <KartaDostepu>
      <div aria-busy="true" aria-label="Sprawdzamy uprawnienia" className="flex flex-col gap-3">
        <h1 className="text-lg font-semibold">Sprawdzamy uprawnienia</h1>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </KartaDostepu>
  );
}

/** Ekran zalogowanego użytkownika bez roli redakcyjnej. */
export function BrakUprawnien({ email, onWyloguj }: { email: string; onWyloguj: () => void }) {
  return (
    <KartaDostepu>
      <ShieldAlert className="size-8 text-primary" aria-hidden="true" />
      <h1 className="text-2xl font-extrabold tracking-[var(--ls-tight)]">Brak uprawnień</h1>
      <p className="text-[15px] text-[var(--text-secondary)]">
        Jesteś zalogowany jako {email || "użytkownik bez adresu e-mail"}, ale to konto nie ma roli
        redaktora ani administratora. Skontaktuj się z administratorem, jeśli potrzebujesz dostępu.
      </p>
      <Button type="button" variant="outline" className="self-start" onClick={onWyloguj}>
        <LogOut aria-hidden="true" />
        Wyloguj
      </Button>
    </KartaDostepu>
  );
}
