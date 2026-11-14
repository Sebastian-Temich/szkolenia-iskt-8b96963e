import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { zamontujTrase } from "./harness-routera";
import { atrapaMakiety } from "./atrapa-klienta";

/**
 * Źródłem danych widoków publicznych jest Supabase, więc test podstawia klienta bazy
 * atrapą wypełnioną treścią makiety. Trasy, loadery, mapery i komponenty zostają
 * produkcyjne — podmieniony jest wyłącznie transport do bazy.
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);

beforeEach(() => atrapaMakiety());

/**
 * D10 i R1: żaden odnośnik wspólnej nawigacji i stopki nie prowadzi w pustkę.
 * Martwym odnośnikiem jest tu cel "/" w miejscu, które obiecuje coś innego niż strona główna —
 * na stronie głównej klik w taki odnośnik nie robi nic i wygląda na zepsutą aplikację.
 *
 * Zmiana w E02/F: „Nasi Trenerzy" było w makiecie, ale w E01 nie miało trasy docelowej,
 * więc widoku nie było, a test pilnował jego NIEOBECNOŚCI. Trasa `/trenerzy` istnieje od
 * E02/F, więc pozycja wraca na listę zatwierdzoną — ten sam inwariant („zero odnośników
 * w pustkę"), rozszerzona lista celów.
 */
const CELE_NAGLOWKA: [string, string][] = [
  ["Obszary", "/#obszary"],
  ["Katalog", "/szkolenia"],
  ["Nasi Trenerzy", "/trenerzy"],
  ["Dofinansowania", "/#dofinansowania"],
  ["Kontakt", "/#kontakt"],
];

const CELE_STOPKI: [string, string][] = [
  ["AI", "/szkolenia?kategoria=AI"],
  ["ESG", "/szkolenia?kategoria=ESG"],
  ["Język angielski", "/szkolenia?kategoria=Angielski"],
  ["Software", "/szkolenia?kategoria=Software"],
  ["B+R", "/szkolenia?kategoria=B%2BR"],
  ["Nasi Trenerzy", "/trenerzy"],
  ["Szkolenia zamknięte", "/#kontakt"],
  ["Dofinansowania", "/#dofinansowania"],
  ["Audyt kompetencji", "/#kontakt"],
];

afterEach(cleanup);

describe("Nawigacja główna", () => {
  it("ma dokładnie zatwierdzone pozycje z działającymi celami", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const nawigacja = within(
      container.querySelector("nav[aria-label='Nawigacja główna']") as HTMLElement,
    );
    for (const [etykieta, cel] of CELE_NAGLOWKA) {
      expect(nawigacja.getByRole("link", { name: etykieta }).getAttribute("href")).toBe(cel);
    }
    expect(nawigacja.getByRole("link", { name: /Zapisz się/ }).getAttribute("href")).toBe(
      "/#kontakt",
    );
  });

  it("nie ma pozycji bez celu w tym etapie", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const nawigacja = container.querySelector("nav[aria-label='Nawigacja główna']");
    expect(nawigacja).not.toBeNull();
    // Zmierzone 7: w tym samym <nav> stoi też odnośnik logo, poza pięcioma pozycjami i „Zapisz się".
    expect((nawigacja as HTMLElement).querySelectorAll("a")).toHaveLength(7);
    const cele = [...(nawigacja as HTMLElement).querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(cele.filter((c) => c === null || c === "")).toHaveLength(0);
  });

  it("jedynym odnośnikiem na samo / w nagłówku jest logo", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const naglowek = container.querySelector("header") as HTMLElement;
    const naStrone = [...naglowek.querySelectorAll("a")].filter(
      (a) => a.getAttribute("href") === "/",
    );
    expect(naStrone).toHaveLength(1);
    expect(naStrone[0]?.textContent).toContain("Rozwijaj swoje kompetencje z ISKT");
  });

  it("#35: nazwa dostępna linku logo zawiera widoczny tekst logo (axe label-content-name-mismatch)", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const nawigacja = within(
      container.querySelector("nav[aria-label='Nawigacja główna']") as HTMLElement,
    );
    const logo = nawigacja.getByRole("link", {
      name: /^Rozwijaj swoje kompetencje z ISKT\b.*strona główna$/,
    });
    expect(logo.getAttribute("href")).toBe("/");
  });

  it("nawigacja mobilna ma te same cele co desktopowa", async () => {
    const user = userEvent.setup();
    const { container } = await zamontujTrase("/szkolenia");

    await user.click(await screen.findByRole("button", { name: "Otwórz menu" }));

    const mobilna = within(
      container.querySelector("nav[aria-label='Nawigacja mobilna']") as HTMLElement,
    );
    for (const [etykieta, cel] of CELE_NAGLOWKA) {
      expect(mobilna.getByRole("link", { name: etykieta }).getAttribute("href")).toBe(cel);
    }
  });
});

describe("Stopka", () => {
  it("każda pozycja prowadzi do istniejącego celu tego etapu", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const stopka = within(container.querySelector("footer") as HTMLElement);
    for (const [etykieta, cel] of CELE_STOPKI) {
      expect(stopka.getByRole("link", { name: etykieta }).getAttribute("href")).toBe(cel);
    }
  });

  it("nie zostawia odnośnika bez celu", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const stopka = container.querySelector("footer") as HTMLElement;
    const wPustke = [...stopka.querySelectorAll("a")].filter(
      (a) => (a.getAttribute("href") ?? "") === "/",
    );
    expect(wPustke).toHaveLength(0);
  });

  it("liczba odnośników stopki zgadza się z zatwierdzoną listą", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const stopka = container.querySelector("footer") as HTMLElement;
    const etykiety = [...stopka.querySelectorAll("ul a")].map((a) => a.textContent?.trim());
    expect(etykiety).toEqual(CELE_STOPKI.map(([etykieta]) => etykieta));
  });
});
