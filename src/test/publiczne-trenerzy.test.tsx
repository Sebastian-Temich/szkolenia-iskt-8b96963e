import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRENERZY_MAKIETY } from "./dane-z-makiety-trenerzy";
import { atrapaMakiety, biezacaAtrapa } from "./atrapa-klienta";
import { adres, zamontujTrase } from "./harness-routera";

/**
 * Publiczne widoki trenerów: lista, profil CV i powiązanie w obie strony.
 *
 * Oczekiwania nie są przepisane z kodu — pochodzą z maszynowego wyciągu z makiety
 * właściciela (`dane-z-makiety-trenerzy.ts`). Trasy, loadery, mapery i komponenty są
 * produkcyjne; podmieniony jest wyłącznie transport do bazy.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());
afterEach(cleanup);

const ANNA = TRENERZY_MAKIETY.find((t) => t.id === "nowak");
if (!ANNA) throw new Error("oracle: brak trenera nowak");

/** Sekcja listy, bez nagłówka i stopki — te mają własne h2 i własne logo. */
async function sekcjaListy(): Promise<HTMLElement> {
  const naglowek = await screen.findByRole("heading", { level: 1 });
  const sekcja = naglowek.closest("section");
  if (!sekcja) throw new Error("test: brak sekcji listy");
  return sekcja as HTMLElement;
}

describe("Lista trenerów", () => {
  it("pokazuje sześć profili z makiety w kolejności sort_order", async () => {
    await zamontujTrase("/trenerzy");
    const sekcja = await sekcjaListy();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Ekspertki i eksperci, którzy Cię poprowadzą",
    );
    const karty = screen.getAllByRole("link", { name: /Zobacz CV/ });
    expect(karty).toHaveLength(6);
    expect(karty.map((k) => k.getAttribute("href"))).toEqual(
      TRENERZY_MAKIETY.map((t) => `/trenerzy/${t.id}`),
    );
    expect([...sekcja.querySelectorAll("h2")].map((h) => h.textContent)).toEqual(
      TRENERZY_MAKIETY.map((t) => t.name),
    );
  });

  it("każda karta niesie rolę, obszary i zapowiedź z makiety", async () => {
    await zamontujTrase("/trenerzy");
    const karta = (await screen.findAllByRole("link", { name: /Zobacz CV/ }))[0] as HTMLElement;
    const wKarcie = within(karta);
    expect(wKarcie.getByRole("heading", { level: 2 })).toHaveTextContent(ANNA.name);
    expect(wKarcie.getByText(ANNA.role)).toBeVisible();
    expect(wKarcie.getByText(ANNA.tagline)).toBeVisible();
    for (const obszar of ANNA.areas) {
      expect(wKarcie.getByText(obszar)).toBeVisible();
    }
  });

  it("klik w kartę prowadzi na profil", async () => {
    const user = userEvent.setup();
    const { router } = await zamontujTrase("/trenerzy");
    await user.click((await screen.findAllByRole("link", { name: /Zobacz CV/ }))[0] as HTMLElement);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(ANNA.name);
    expect(adres(router)).toBe("/trenerzy/nowak");
  });

  it("bez zdjęcia pokazuje inicjały jako dekorację, nie jako powtórzone nazwisko", async () => {
    await zamontujTrase("/trenerzy");
    const sekcja = await sekcjaListy();
    expect(sekcja.querySelectorAll("img")).toHaveLength(0);
    const inicjaly = [...sekcja.querySelectorAll('[aria-hidden="true"]')]
      .map((e) => e.textContent)
      .filter((tekst) => TRENERZY_MAKIETY.some((t) => t.initials === tekst));
    expect(inicjaly).toEqual(TRENERZY_MAKIETY.map((t) => t.initials));
  });

  it("podany adres zdjęcia wypiera inicjały i ma tekst alternatywny", async () => {
    const wiersz = biezacaAtrapa().dane["trenerzy"]?.find((w) => w["id"] === "nowak");
    if (!wiersz) throw new Error("test: brak trenera nowak");
    wiersz["photo_url"] = "https://przyklad.test/anna.jpg";
    await zamontujTrase("/trenerzy");
    const sekcja = await sekcjaListy();
    const zdjecie = screen.getByRole("img", { name: `Zdjęcie: ${ANNA.name}` });
    expect(zdjecie.getAttribute("src")).toBe("https://przyklad.test/anna.jpg");
    // Dokładnie jedno zdjęcie i o jedne inicjały mniej — adres wypiera dekorację.
    expect(sekcja.querySelectorAll("img")).toHaveLength(1);
    expect(sekcja.textContent).not.toContain(ANNA.initials);
  });
});

describe("Profil trenera", () => {
  it("pokazuje biogram, doświadczenie, wykształcenie i specjalizacje z makiety", async () => {
    await zamontujTrase("/trenerzy/nowak");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(ANNA.name);
    expect(screen.getByText(ANNA.role)).toBeVisible();
    expect(screen.getByText(ANNA.bio)).toBeVisible();

    const doswiadczenie = screen
      .getByRole("heading", { name: "Doświadczenie zawodowe" })
      .closest("section") as HTMLElement;
    for (const pozycja of ANNA.experience) {
      expect(within(doswiadczenie).getByText(pozycja.period)).toBeVisible();
      expect(within(doswiadczenie).getByText(pozycja.title)).toBeVisible();
      expect(within(doswiadczenie).getByText(pozycja.org)).toBeVisible();
      expect(within(doswiadczenie).getByText(pozycja.desc)).toBeVisible();
    }

    const wyksztalcenie = screen
      .getByRole("heading", { name: "Wykształcenie i certyfikaty" })
      .closest("section") as HTMLElement;
    for (const pozycja of ANNA.education) {
      expect(within(wyksztalcenie).getByText(pozycja.title)).toBeVisible();
      expect(within(wyksztalcenie).getByText(pozycja.org)).toBeVisible();
    }

    const specjalizacje = screen
      .getByRole("heading", { name: "Specjalizacje" })
      .closest("section") as HTMLElement;
    expect([...specjalizacje.querySelectorAll("li")].map((li) => li.textContent)).toEqual(
      ANNA.skills,
    );
  });

  it("ścieżka nawigacji wraca na listę trenerów", async () => {
    const user = userEvent.setup();
    const { router } = await zamontujTrase("/trenerzy/nowak");
    await screen.findByRole("heading", { level: 1 });
    const okruszki = screen.getByRole("navigation", { name: "Ścieżka nawigacji" });
    await user.click(within(okruszki).getByRole("link", { name: "Nasi Trenerzy" }));
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Ekspertki i eksperci",
    );
    expect(adres(router)).toBe("/trenerzy");
  });

  it("nieznany adres daje drogę powrotu, a nie błąd pobrania", async () => {
    await zamontujTrase("/trenerzy/nie-istnieje");
    expect(
      await screen.findByRole("heading", { name: "Nie znaleźliśmy tego trenera" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Wróć do listy trenerów/ }).getAttribute("href")).toBe(
      "/trenerzy",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("puste listy CV nie rysują pustych sekcji", async () => {
    const wiersz = biezacaAtrapa().dane["trenerzy"]?.find((w) => w["id"] === "nowak");
    if (!wiersz) throw new Error("test: brak trenera nowak");
    wiersz["experience"] = [];
    wiersz["education"] = [];
    wiersz["skills"] = [];
    await zamontujTrase("/trenerzy/nowak");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(ANNA.name);
    expect(screen.getByRole("heading", { name: "O mnie" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Doświadczenie zawodowe" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Wykształcenie i certyfikaty" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Specjalizacje" })).toBeNull();
  });
});

describe("Powiązanie szkolenie ↔ trener działa w obie strony", () => {
  it("profil trenera prowadzi do jego szkoleń w kolejności przypisań", async () => {
    const user = userEvent.setup();
    const { router } = await zamontujTrase("/trenerzy/nowak");
    const prowadzi = (await screen.findByRole("heading", { name: "Prowadzi szkolenia" })).closest(
      "section",
    ) as HTMLElement;
    const odnosniki = within(prowadzi).getAllByRole("link");
    expect(odnosniki.map((a) => a.getAttribute("href"))).toEqual(
      ANNA.teach.map((id) => `/szkolenia/${id}`),
    );
    await user.click(odnosniki[0] as HTMLElement);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Generatywne AI dla biznesu",
    );
    expect(adres(router)).toBe("/szkolenia/genai");
  });

  it("szczegół szkolenia prowadzi do profili prowadzących", async () => {
    const user = userEvent.setup();
    const { router } = await zamontujTrase("/szkolenia/genai");
    await screen.findByRole("heading", { level: 1 });
    const prowadzacy = screen
      .getByRole("heading", { name: "Prowadzący" })
      .closest("section") as HTMLElement;
    const odnosniki = within(prowadzacy).getAllByRole("link");
    // Makieta przypisuje temu szkoleniu dwóch trenerów — relacja jest M:N, nie 1:N.
    expect(odnosniki).toHaveLength(2);
    expect(odnosniki.map((a) => a.getAttribute("href"))).toEqual([
      "/trenerzy/nowak",
      "/trenerzy/krol",
    ]);
    expect(prowadzacy.textContent).toContain(ANNA.role);
    await user.click(odnosniki[0] as HTMLElement);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(ANNA.name);
    expect(adres(router)).toBe("/trenerzy/nowak");
  });

  it("kolejność bierze się z przypisań, nie z sort_order encji", async () => {
    // Jakub Król ma w makiecie teach = ["ai-agents", "genai"], a w tabeli szkoleń
    // genai stoi przed ai-agents. Gdyby kod oddawał kolejność z `in (...)`, zobaczylibyśmy
    // genai jako pierwsze — więc ten test rozróżnia obie kolejności, inaczej niż profil Anny.
    const krol = TRENERZY_MAKIETY.find((t) => t.id === "krol");
    if (!krol) throw new Error("oracle: brak trenera krol");
    expect(krol.teach).toEqual(["ai-agents", "genai"]);
    const kolejnoscWBazie = (biezacaAtrapa().dane["szkolenia"] ?? []).map((w) => w["id"]);
    expect(kolejnoscWBazie.indexOf("genai")).toBeLessThan(kolejnoscWBazie.indexOf("ai-agents"));

    await zamontujTrase("/trenerzy/krol");
    await screen.findByRole("heading", { level: 1 });
    const prowadzi = screen
      .getByRole("heading", { name: "Prowadzi szkolenia" })
      .closest("section") as HTMLElement;
    expect(
      within(prowadzi)
        .getAllByRole("link")
        .map((a) => a.getAttribute("href")),
    ).toEqual(["/szkolenia/ai-agents", "/szkolenia/genai"]);
  });

  it("szkolenie bez przypisań nie rysuje bloku prowadzących", async () => {
    biezacaAtrapa().dane["szkolenie_trener"] = [];
    await zamontujTrase("/szkolenia/genai");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Generatywne AI");
    expect(screen.queryByRole("heading", { name: /^Prowadzący/ })).toBeNull();
    // Brak przypisań nie generuje zapytania o encje trenerów.
    expect(biezacaAtrapa().gdzie("trenerzy", "select")).toHaveLength(0);
  });

  it("trener bez przypisań mówi to wprost, zamiast pokazać pustą listę", async () => {
    biezacaAtrapa().dane["szkolenie_trener"] = [];
    await zamontujTrase("/trenerzy/nowak");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(ANNA.name);
    const prowadzi = screen
      .getByRole("heading", { name: "Prowadzi szkolenia" })
      .closest("section") as HTMLElement;
    expect(within(prowadzi).queryAllByRole("link")).toHaveLength(0);
    expect(prowadzi.textContent).toContain("nie ma teraz przypisanego szkolenia");
    expect(biezacaAtrapa().gdzie("szkolenia", "select")).toHaveLength(0);
  });
});
