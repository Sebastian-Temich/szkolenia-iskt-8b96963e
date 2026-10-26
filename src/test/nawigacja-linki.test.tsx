import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { zamontujTrase } from "./harness-routera";

/**
 * D10 i R1: żaden odnośnik wspólnej nawigacji i stopki nie prowadzi w pustkę.
 * Martwym odnośnikiem jest tu cel "/" w miejscu, które obiecuje coś innego niż strona główna —
 * na stronie głównej klik w taki odnośnik nie robi nic i wygląda na zepsutą aplikację.
 */
const CELE_NAGLOWKA: [string, string][] = [
  ["Obszary", "/#obszary"],
  ["Katalog", "/szkolenia"],
  ["Dofinansowania", "/#dofinansowania"],
  ["Kontakt", "/#kontakt"],
];

const CELE_STOPKI: [string, string][] = [
  ["AI", "/szkolenia?kategoria=AI"],
  ["ESG", "/szkolenia?kategoria=ESG"],
  ["Język angielski", "/szkolenia?kategoria=Angielski"],
  ["Software · B+R", "/szkolenia"],
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
    expect(container.textContent).not.toContain("Nasi Trenerzy");
    expect(screen.queryByRole("link", { name: /Trenerzy/ })).toBeNull();
  });

  it("jedynym odnośnikiem na samo / w nagłówku jest logo", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const naglowek = container.querySelector("header") as HTMLElement;
    const naStrone = [...naglowek.querySelectorAll("a")].filter(
      (a) => a.getAttribute("href") === "/",
    );
    expect(naStrone).toHaveLength(1);
    expect(naStrone[0]?.getAttribute("aria-label")).toBe("ISKT — strona główna");
  });

  it("nawigacja mobilna ma te same cele co desktopowa", async () => {
    const user = userEvent.setup();
    const { container } = await zamontujTrase("/szkolenia");

    await user.click((await screen.findByRole("button", { name: "Otwórz menu" }));

    const mobilna = within(
      container.querySelector("nav[aria-label='Nawigacja mobilna']") as HTMLElement,
    );
    for (const [etykieta, cel] of CELE_NAGLOWKA) {
      expect(mobilna.getByRole("link", { name: etykieta }).getAttribute("href")).toBe(cel);
    }
    expect(mobilna.queryByRole("link", { name: /Trenerzy/ })).toBeNull();
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

  it("nie zostawia odnośnika bez celu ani pozycji trenerów", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const stopka = container.querySelector("footer") as HTMLElement;
    const wPustke = [...stopka.querySelectorAll("a")].filter(
      (a) => (a.getAttribute("href") ?? "") === "/",
    );
    expect(wPustke).toHaveLength(0);
    expect(stopka.textContent).not.toContain("Nasi Trenerzy");
  });

  it("liczba odnośników stopki zgadza się z zatwierdzoną listą", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const stopka = container.querySelector("footer") as HTMLElement;
    const etykiety = [...stopka.querySelectorAll("ul a")].map((a) => a.textContent?.trim());
    expect(etykiety).toEqual(CELE_STOPKI.map(([etykieta]) => etykieta));
  });
});
