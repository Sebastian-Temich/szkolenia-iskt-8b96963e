import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zaloguj, type SesjaPanelu } from "@/lib/panel/sesja";
import { komunikatBledu } from "@/lib/panel/bledy";
import { KartaDostepu } from "./EkranyDostepu";
import { PoleFormularza } from "./pola";
import { KLASY_INPUT, ariaPola } from "./pola-klasy";

const schemat = z.object({
  email: z.string().trim().min(1, "Wpisz adres e-mail.").email("Wpisz poprawny adres e-mail."),
  haslo: z.string().min(1, "Wpisz hasło."),
});
type Dane = z.infer<typeof schemat>;
const BLAD_LOGOWANIA = "Nie udało się zalogować. Sprawdź e-mail i hasło.";

/** Formularz logowania e-mailem i hasłem; panel nie zakłada kont. */
export function FormularzLogowania({ onZalogowano }: { onZalogowano: (s: SesjaPanelu) => void }) {
  const [blad, setBlad] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Dane>({
    resolver: zodResolver(schemat),
    defaultValues: { email: "", haslo: "" },
  });
  const wyslij = handleSubmit(async (d) => {
    setBlad(null);
    try {
      onZalogowano(await zaloguj(d.email, d.haslo));
    } catch (e) {
      setBlad(komunikatBledu(e, BLAD_LOGOWANIA));
    }
  });
  const e = formState.errors;
  return (
    <KartaDostepu>
      <h1 className="text-2xl font-extrabold tracking-[var(--ls-tight)]">Panel redakcyjny</h1>
      <p className="text-[15px] text-[var(--text-secondary)]">
        Zaloguj się kontem nadanym przez administratora.
      </p>
      {blad ? (
        <p role="alert" className="rounded-md bg-[var(--error-50)] p-3 text-sm text-destructive">
          {blad}
        </p>
      ) : null}
      <form onSubmit={wyslij} noValidate className="flex flex-col gap-4">
        <PoleFormularza id="logowanie-email" etykieta="E-mail" blad={e.email?.message}>
          <input
            type="email"
            autoComplete="username"
            className={KLASY_INPUT}
            {...ariaPola("logowanie-email", e.email?.message)}
            {...register("email")}
          />
        </PoleFormularza>
        <PoleFormularza id="logowanie-haslo" etykieta="Hasło" blad={e.haslo?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className={KLASY_INPUT}
            {...ariaPola("logowanie-haslo", e.haslo?.message)}
            {...register("haslo")}
          />
        </PoleFormularza>
        <Button type="submit" disabled={formState.isSubmitting} className="rounded-pill">
          <LogIn aria-hidden="true" />
          {formState.isSubmitting ? "Logujemy…" : "Zaloguj się"}
        </Button>
      </form>
    </KartaDostepu>
  );
}
