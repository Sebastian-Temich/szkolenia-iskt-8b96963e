import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STATUS_OPUBLIKOWANY } from "@/lib/supabase/odczyt";
import { utworzAtrape } from "./atrapa-supabase";
import {
  atrapaMakiety,
  biezacaAtrapa,
  POWOD_BRAKU_KONFIGURACJI,
  ustawAtrape,
  ustawBrakKonfiguracji,
} from "./atrapa-klienta";
import { zamontujTrase } from "./harness-routera";

/**
 * Granica widoczności publicznej i uczciwość stanów brzegowych.
 *
 * Najważniejsza część: **szkic nie może wyciekać** — ani przez listę, ani przez
 * bezpośredni adres, ani przez filtr kategorii, ani przez wyszukiwanie frazy. Kod pyta
 * bazę jawnym `status = 'published'` i nie opiera się wyłącznie na politykach RLS: ten
 * sam zestaw asercji trzyma też wtedy, gdy ktoś puści widoki na bazie bez polityk.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());
afterEach(cleanup);

/** Przestawia szkolenie na szkic w atrapie; zwraca jego treści do asercji nieobecności. */
function naSzkic(id: string): { title: string; opis: string } {
  const wiersz = biezacaAtrapa().dane["szkolenia"]?.find((w) => w["id"] === id);
  if (!wiersz) throw new Error(`test: brak wiersza ${id}`);
  wiersz["status"] = "draft";
  wiersz["published_at"] = null;
  return { title: String(wiersz["title"]), opis: String(wiersz["opis"]) };
}

describe("Szkic nie wycieka do widoków publicznych", () => {
  it("nie ma go na liście ani w liczniku wyników", async () => {
    const szkic = naSzkic("esg");
    const { container } = await zamontujTrase("/szkolenia");
    expect(await screen.findByRole("status")).toHaveTextContent("8 szkoleń");
    expect(screen.getAllByRole("link", { name: /Szczegóły/ })).toHaveLength(8);
    expect(container.querySelector('a[href^="/szkolenia/esg"]')).toBeNull();
    expect(container.textContent).not.toContain(szkic.title);
    expect(container.textContent).not.toContain(szkic.opis);
  });

  it("bezpośredni adres szkicu daje nieznalezione, a nie treść", async () => {
    const szkic = naSzkic("esg");
    const { container } = await zamontujTrase("/szkolenia/esg");
    expect(
      await screen.findByRole("heading", { name: "Nie znaleźliśmy tego szkolenia" }),
    ).toBeVisible();
    expect(container.textContent).not.toContain(szkic.title);
    expect(container.textContent).not.toContain(szkic.opis);
    // Ten sam widok, co dla adresu nieistniejącego — szkic nie jest odróżnialny od braku.
    expect(screen.getByRole("link", { name: /Wróć do katalogu/ }).getAttribute("href")).toBe(
      "/szkolenia",
    );
  });

  it("filtr kategorii nie jest obejściem — szkic wypada też z zawężonej listy", async () => {
    const szkic = naSzkic("esg");
    const { container } = await zamontujTrase("/szkolenia?kategoria=ESG");
    // W makiecie kategoria ESG ma dwa szkolenia; po wycofaniu jednego zostaje drugie.
    expect(await screen.findByRole("status")).toHaveTextContent("1 szkolenie");
    expect(container.querySelector('a[href^="/szkolenia/co2"]')).not.toBeNull();
    expect(container.querySelector('a[href^="/szkolenia/esg"]')).toBeNull();
    expect(container.textContent).not.toContain(szkic.title);
  });

  it("gdy cała kategoria jest w szkicu, filtr daje stan pusty, nie wyciek", async () => {
    const pierwszy = naSzkic("esg");
    const drugi = naSzkic("co2");
    const { container } = await zamontujTrase("/szkolenia?kategoria=ESG");
    expect(await screen.findByRole("status")).toHaveTextContent("0 szkoleń");
    expect(screen.getByRole("heading", { name: "Brak szkoleń dla tych kryteriów" })).toBeVisible();
    expect(container.textContent).not.toContain(pierwszy.title);
    expect(container.textContent).not.toContain(drugi.title);
  });

  it("wyszukiwanie frazy z opisu szkicu nic nie znajduje", async () => {
    naSzkic("esg");
    const { container } = await zamontujTrase("/szkolenia?q=CSRD");
    expect(await screen.findByRole("status")).toHaveTextContent("0 szkoleń");
    expect(container.querySelector('a[href^="/szkolenia/esg"]')).toBeNull();
  });

  it("każdy odczyt oferty niesie filtr statusu", async () => {
    await zamontujTrase("/szkolenia/genai");
    await screen.findByRole("heading", { level: 1 });
    const odczyty = biezacaAtrapa().gdzie("szkolenia", "select");
    expect(odczyty.length).toBeGreaterThan(0);
    for (const odczyt of odczyty) {
      expect(odczyt.filtry).toContainEqual({
        kolumna: "status",
        operator: "eq",
        wartosc: STATUS_OPUBLIKOWANY,
      });
    }
  });

  it("trener w szkicu nie pokazuje się ani na liście, ani pod własnym adresem", async () => {
    const wiersz = biezacaAtrapa().dane["trenerzy"]?.find((w) => w["id"] === "nowak");
    if (!wiersz) throw new Error("test: brak trenera nowak");
    wiersz["status"] = "draft";
    const nazwa = String(wiersz["name"]);

    const lista = await zamontujTrase("/trenerzy");
    expect(await screen.findByRole("heading", { level: 1 })).toBeVisible();
    expect(lista.container.textContent).not.toContain(nazwa);
    cleanup();

    const profil = await zamontujTrase("/trenerzy/nowak");
    expect(
      await screen.findByRole("heading", { name: "Nie znaleźliśmy tego trenera" }),
    ).toBeVisible();
    expect(profil.container.textContent).not.toContain(String(wiersz["bio"]));
  });

  it("szkic nie wycieka przez powiązanie w żadną stronę", async () => {
    naSzkic("ai-agents");
    const trener = biezacaAtrapa().dane["trenerzy"]?.find((w) => w["id"] === "krol");
    if (!trener) throw new Error("test: brak trenera krol");
    trener["status"] = "draft";

    // Profil opublikowanego trenera nie wymienia szkolenia w szkicu.
    const profil = await zamontujTrase("/trenerzy/nowak");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("dr Anna Nowak");
    const prowadzi = screen.getByRole("heading", { name: "Prowadzi szkolenia" }).closest("section");
    expect(prowadzi?.textContent).toContain("Generatywne AI dla biznesu");
    expect(prowadzi?.textContent).not.toContain("Agenci AI");
    cleanup();

    // Szczegół opublikowanego szkolenia nie wymienia trenera w szkicu.
    await zamontujTrase("/szkolenia/genai");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Generatywne AI");
    const prowadzacy = screen
      .getByRole("heading", { name: /^Prowadzący/ })
      .closest("section") as HTMLElement;
    expect(prowadzacy.textContent).toContain("dr Anna Nowak");
    expect(prowadzacy.textContent).not.toContain("mgr Jakub Król");
  });
});

describe("Pusty zbiór to pustka, nie awaria", () => {
  beforeEach(() =>
    ustawAtrape(utworzAtrape({ szkolenia: [], trenerzy: [], szkolenie_trener: [] })),
  );

  it("katalog pokazuje stan pusty z wyjściem", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    expect(await screen.findByRole("status")).toHaveTextContent("0 szkoleń");
    expect(screen.getByRole("heading", { name: "Brak szkoleń dla tych kryteriów" })).toBeVisible();
    expect(container.querySelectorAll('a[href^="/szkolenia/"]')).toHaveLength(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lista trenerów mówi, że profili nie ma, zamiast udawać awarię", async () => {
    await zamontujTrase("/trenerzy");
    expect(
      await screen.findByRole("heading", { name: "Profile trenerów przygotowujemy" }),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Ekspertki i eksperci, którzy Cię poprowadzą",
    );
  });
});

describe("Błąd źródła nie udaje pustej oferty", () => {
  it("katalog pokazuje komunikat po polsku bez treści wyjątku i da się ponowić", async () => {
    const user = userEvent.setup();
    biezacaAtrapa().sterowanie.tryby["szkolenia"] = "blad";
    const { container } = await zamontujTrase("/szkolenia");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nie udało się wczytać katalogu" })).toBeVisible();
    expect(container.textContent).not.toContain("connection reset");
    expect(container.textContent).not.toContain("XX000");
    expect(screen.queryByRole("heading", { name: "Brak szkoleń dla tych kryteriów" })).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();

    const przed = biezacaAtrapa().gdzie("szkolenia", "select").length;
    biezacaAtrapa().sterowanie.tryby["szkolenia"] = "ok";
    await user.click(screen.getByRole("button", { name: /Spróbuj ponownie/ }));
    await waitFor(() =>
      expect(biezacaAtrapa().gdzie("szkolenia", "select").length).toBeGreaterThan(przed),
    );
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("9 szkoleń"));
  });

  it("odmowa polityki RLS nie wychodzi kodem błędu do widoku", async () => {
    biezacaAtrapa().sterowanie.tryby["szkolenia"] = "odmowa";
    const { container } = await zamontujTrase("/szkolenia");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(container.textContent).not.toContain("42501");
    expect(container.textContent).not.toContain("row-level security");
  });

  it("lista trenerów ma własny komunikat błędu", async () => {
    biezacaAtrapa().sterowanie.tryby["trenerzy"] = "blad";
    const { container } = await zamontujTrase("/trenerzy");
    expect(
      await screen.findByRole("heading", { name: "Nie udało się wczytać listy trenerów" }),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Profile trenerów przygotowujemy" })).toBeNull();
    expect(container.textContent).not.toContain("XX000");
  });

  it("błąd tabeli przypisań nie pokazuje szkolenia bez prowadzących", async () => {
    biezacaAtrapa().sterowanie.tryby["szkolenie_trener"] = "blad";
    await zamontujTrase("/szkolenia/genai");
    expect(
      await screen.findByRole("heading", { name: "Nie udało się wczytać szkolenia" }),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: /Generatywne AI/ })).toBeNull();
  });
});

describe("Brak konfiguracji połączenia", () => {
  beforeEach(() => ustawBrakKonfiguracji());

  it("katalog pokazuje błąd, nie pustą ofertę, i nie pyta bazy", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nie udało się wczytać katalogu" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Brak szkoleń dla tych kryteriów" })).toBeNull();
    // Zero zapytań: bez konfiguracji nie ma do czego się łączyć, więc kod nawet nie próbuje.
    expect(biezacaAtrapa().zapytaniaODane()).toHaveLength(0);
    // Powód jest techniczny i trafia do konsoli, nie na stronę dla gościa.
    expect(container.textContent).not.toContain(POWOD_BRAKU_KONFIGURACJI);
    expect(container.textContent).not.toContain("VITE_SUPABASE");
  });

  it("lista trenerów zachowuje się tak samo", async () => {
    await zamontujTrase("/trenerzy");
    expect(
      await screen.findByRole("heading", { name: "Nie udało się wczytać listy trenerów" }),
    ).toBeVisible();
    expect(biezacaAtrapa().zapytaniaODane()).toHaveLength(0);
  });
});
