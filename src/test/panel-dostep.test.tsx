import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StanKonfiguracji } from "@/lib/supabase/klient";
import { utworzAtrape, wierszSzkolenia, type Atrapa } from "./atrapa-supabase";
import { zamontujTrase } from "./harness-routera";

const stan = vi.hoisted(() => ({
  atrapa: null as Atrapa | null,
  konfig: { ok: true } as StanKonfiguracji,
}));

vi.mock("@/lib/supabase/klient", () => ({
  stanKonfiguracji: () => stan.konfig,
  pobierzKlienta: () => {
    if (!stan.atrapa) throw new Error("test: brak atrapy");
    return stan.atrapa.klient;
  },
}));

function atrapa(): Atrapa {
  if (!stan.atrapa) throw new Error("test: brak atrapy");
  return stan.atrapa;
}

beforeEach(() => {
  stan.konfig = { ok: true };
  stan.atrapa = utworzAtrape({ szkolenia: [wierszSzkolenia()] });
});
afterEach(cleanup);

describe("Bramka panelu — pięć stanów", () => {
  it("1. bez konfiguracji pokazuje ekran nieskonfigurowanego panelu zamiast logowania", async () => {
    stan.konfig = { ok: false, powod: "Brak konfiguracji połączenia z bazą." };
    await zamontujTrase("/panel/szkolenia");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Panel nie jest skonfigurowany" }),
    ).toBeVisible();
    expect(screen.getByText("Brak konfiguracji połączenia z bazą.")).toBeVisible();
    expect(screen.queryByLabelText("Hasło")).toBeNull();
    expect(atrapa().wywolania).toHaveLength(0);
  });

  it("2. podczas sprawdzania sesji pokazuje stan ładowania z aria-busy", async () => {
    atrapa().sterowanie.sesjaWisi = true;
    await zamontujTrase("/panel/szkolenia");
    const ladowanie = await screen.findByLabelText("Sprawdzamy uprawnienia");
    expect(ladowanie).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByLabelText("Hasło")).toBeNull();
  });

  it("3. bez sesji pokazuje logowanie bez rejestracji; złe hasło daje komunikat bez treści wyjątku", async () => {
    const user = userEvent.setup();
    const { container } = await zamontujTrase("/panel/szkolenia");
    await user.type(await screen.findByLabelText("E-mail"), "redaktor@iskt.pl");
    await user.type(screen.getByLabelText("Hasło"), "zle-haslo");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się zalogować. Sprawdź e-mail i hasło.",
    );
    expect(container.textContent).not.toContain("Invalid login credentials");
    expect(screen.queryByText(/zarejestruj|załóż konto/i)).toBeNull();
    expect(atrapa().zapytaniaODane()).toHaveLength(0);
  });

  it("3b. poprawne logowanie z rolą otwiera panel", async () => {
    const user = userEvent.setup();
    await zamontujTrase("/panel/szkolenia");
    await user.type(await screen.findByLabelText("E-mail"), "redaktor@iskt.pl");
    await user.type(screen.getByLabelText("Hasło"), "poprawne-haslo");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Szkolenia" })).toBeVisible();
    expect(screen.getByText("redaktor@iskt.pl")).toBeVisible();
  });

  it("4. sesja bez roli: ekran braku uprawnień, bez akcji edycji i bez zapytań o dane", async () => {
    atrapa().sterowanie.sesja = { user: { email: "gosc@iskt.pl" }, access_token: "t" };
    atrapa().sterowanie.rpc["moje_role"] = { data: [], error: null };
    await zamontujTrase("/panel/szkolenia");
    expect(await screen.findByRole("heading", { level: 1, name: "Brak uprawnień" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Wyloguj" })).toBeEnabled();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("link", { name: /Dodaj szkolenie/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Publikuj|Usuń|Edytuj/ })).toBeNull();
    expect(atrapa().zapytaniaODane()).toHaveLength(0);
  });

  it("5. sesja z rolą pokazuje panel z listą i adresem zalogowanego", async () => {
    atrapa().sterowanie.sesja = { user: { email: "redaktor@iskt.pl" }, access_token: "t" };
    await zamontujTrase("/panel");
    expect(await screen.findByRole("heading", { level: 1, name: "Szkolenia" })).toBeVisible();
    expect(await screen.findByText("Generatywne AI dla biznesu")).toBeVisible();
    expect(screen.getByText("redaktor@iskt.pl")).toBeVisible();
  });

  it("gdy moje_role zawiedzie, panel pyta awaryjnie is_staff", async () => {
    atrapa().sterowanie.sesja = { user: { email: "redaktor@iskt.pl" }, access_token: "t" };
    atrapa().sterowanie.rpc["moje_role"] = { data: null, error: { message: "boom" } };
    atrapa().sterowanie.rpc["is_staff"] = { data: true, error: null };
    await zamontujTrase("/panel/szkolenia");
    expect(await screen.findByRole("heading", { level: 1, name: "Szkolenia" })).toBeVisible();
    expect(atrapa().gdzie("is_staff", "rpc")).toHaveLength(1);
  });

  it("wylogowanie wraca do formularza logowania", async () => {
    const user = userEvent.setup();
    atrapa().sterowanie.sesja = { user: { email: "redaktor@iskt.pl" }, access_token: "t" };
    await zamontujTrase("/panel/szkolenia");
    await screen.findByRole("heading", { level: 1, name: "Szkolenia" });
    await user.click(screen.getByRole("button", { name: "Wyloguj" }));
    expect(await screen.findByLabelText("Hasło")).toBeVisible();
    await waitFor(() => expect(atrapa().sterowanie.sesja).toBeNull());
    expect(screen.queryByRole("table")).toBeNull();
  });
});
