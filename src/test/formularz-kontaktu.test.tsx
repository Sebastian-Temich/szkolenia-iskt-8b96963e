import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SekcjaKontakt } from "@/components/strona-glowna/SekcjaKontakt";

/**
 * Wygląd i pola formularza kontaktu (F-02). Do #46 formularz był nieaktywny; „Było → ma być”
 * z karty W-12 zastąpiło testy blokady testami wysyłki w formularz-wysylka.test.tsx. Tu zostaje:
 * pusty formularz nie dotyka sieci ani funkcji serwerowej i nie udaje sukcesu.
 */
const wyslij = vi.hoisted(() => vi.fn());
vi.mock("@/lib/zgloszenia/wyslij", () => ({ wyslijZgloszenie: wyslij }));

let zapytaniaSieciowe: string[] = [];

beforeEach(() => {
  zapytaniaSieciowe = [];
  vi.stubGlobal("fetch", (...args: unknown[]) => {
    zapytaniaSieciowe.push(String(args[0]));
    throw new Error("test: formularz nie ma prawa wołać sieci");
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const zamontuj = (odbiorca: "individual" | "company" = "individual") =>
  render(<SekcjaKontakt odbiorca={odbiorca} onZmiana={() => undefined} />);

describe("Formularz bez JavaScriptu (review PR #49)", () => {
  it("HTML z serwera: przycisk wyłączony, formularz method=post bez action", () => {
    const html = renderToString(<SekcjaKontakt odbiorca="individual" onZmiana={() => undefined} />);
    const dokument = new DOMParser().parseFromString(html, "text/html");
    const formularz = dokument.querySelector("form");
    expect(formularz?.getAttribute("method")).toBe("post");
    expect(formularz?.hasAttribute("action")).toBe(false);
    const przycisk = dokument.querySelector('button[type="submit"]');
    expect(przycisk?.textContent).toBe("Wyślij zgłoszenie");
    expect(przycisk?.hasAttribute("disabled")).toBe(true);
    // E-001: komunikat jest zwykłym tekstem HTML z serwera (nie <noscript>), więc widzi go
    // przeglądarka bez JavaScriptu.
    expect(dokument.querySelector("noscript")).toBeNull();
    expect(dokument.querySelector("form")?.textContent).toContain(
      "Wysłanie formularza wymaga włączonego JavaScriptu. Napisz do nas: szkolenia@iskt.pl.",
    );
  });

  it("E-001: po hydratacji komunikat o JavaScripcie znika, a przycisk jest aktywny", () => {
    zamontuj();
    expect(screen.queryByText(/wymaga włączonego JavaScriptu/)).toBeNull();
    expect(screen.getByRole("button", { name: "Wyślij zgłoszenie" })).toBeEnabled();
  });
});

describe("Formularz kontaktowy — pola i pusty formularz", () => {
  it("przycisk wysyłki jest aktywny, bez napisu o niepodłączeniu (#46)", () => {
    zamontuj();
    expect(screen.getByRole("button", { name: /Wyślij zgłoszenie/ })).toBeEnabled();
    expect(screen.queryByText(/Formularz zostanie podłączony/)).toBeNull();
  });

  it("pusty formularz: brak zapytania sieciowego i wywołania funkcji serwerowej", async () => {
    const user = userEvent.setup();
    const { container } = zamontuj();
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await user.click(screen.getByRole("button", { name: /Wyślij zgłoszenie/ }));
    expect(zapytaniaSieciowe).toEqual([]);
    expect(wyslij).not.toHaveBeenCalled();
  });

  it("pusty formularz nie udaje sukcesu", () => {
    const { container } = zamontuj();
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(container.querySelector("form")).not.toBeNull();
    for (const falsz of [/Dziękujemy/i, /Zgłoszenie dotarło/i]) {
      expect(screen.queryByText(falsz)).toBeNull();
    }
  });

  it("nie ma odnośnika mailto, a jedyny odnośnik tel: to telefon firmy (#54)", () => {
    const { container } = zamontuj();
    const hrefy = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "");
    expect(hrefy.filter((h) => h.startsWith("mailto:"))).toEqual([]);
    expect(hrefy.filter((h) => h.startsWith("tel:"))).toEqual(["tel:+48504083825"]);
  });

  it("ma wszystkie pola makiety z widoczną etykietą", () => {
    zamontuj();
    for (const etykieta of [
      "Imię i nazwisko",
      "E-mail",
      "Telefon",
      "Interesujące szkolenie / obszar",
      "Wiadomość",
    ]) {
      expect(screen.getByLabelText(new RegExp(etykieta))).toBeInTheDocument();
    }
  });

  it("pola są niekontrolowane, więc wpisany tekst zostaje bez stanu w Reakcie", async () => {
    const user = userEvent.setup();
    zamontuj();
    const pole = screen.getByLabelText(/Imię i nazwisko/);
    await user.type(pole, "Jan Kowalski");
    expect(pole).toHaveValue("Jan Kowalski");
    expect(zapytaniaSieciowe).toEqual([]);
  });

  it("ma zgodę na kontakt jako pole wyboru", () => {
    const { container } = zamontuj();
    expect(container.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(screen.getByText(/Wyrażam zgodę na kontakt/)).toBeInTheDocument();
  });

  it("lista obszarów ma sześć opcji właściciela plus pustą podpowiedź", () => {
    zamontuj();
    const lista = screen.getByLabelText(/Interesujące szkolenie \/ obszar/);
    expect([...lista.querySelectorAll("option")].map((o) => o.textContent)).toEqual([
      "Wybierz…",
      "AI i narzędzia generatywne",
      "ESG i zrównoważony rozwój",
      "Język angielski",
      "Rozwój oprogramowania",
      "Projekty B+R",
      "Szkolenie zamknięte dla zespołu",
    ]);
    expect(lista).toHaveValue("");
  });

  it("sekcja ma zakotwiczenie kontakt", () => {
    const { container } = zamontuj();
    expect(container.querySelector("#kontakt")).not.toBeNull();
  });

  it("nagłówek i zdanie zmieniają się z odbiorcą", () => {
    const pierwszy = zamontuj("individual");
    expect(screen.getByRole("heading", { name: "Zapisz się na szkolenie" })).toBeInTheDocument();
    pierwszy.unmount();
    zamontuj("company");
    expect(
      screen.getByRole("heading", { name: "Zapytaj o szkolenie dla firmy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Opowiedz nam o zespole — przygotujemy program i wycenę z dofinansowaniem."),
    ).toBeInTheDocument();
  });

  it("telefon +48 504 083 825 to odnośnik tel: bez dopisku o przykładowym numerze (#54)", () => {
    zamontuj();
    expect(screen.getByText("szkolenia@iskt.pl")).toBeInTheDocument();
    const telefon = screen.getByRole("link", { name: "+48 504 083 825" });
    expect(telefon.getAttribute("href")).toBe("tel:+48504083825");
    expect(screen.queryByText(/Numer przykładowy/)).toBeNull();
    expect(screen.queryByText(/32 000 00 00/)).toBeNull();
    expect(screen.getByText("Żory, woj. śląskie")).toBeInTheDocument();
  });
});
