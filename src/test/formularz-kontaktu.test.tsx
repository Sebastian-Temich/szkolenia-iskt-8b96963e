import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SekcjaKontakt } from "@/components/strona-glowna/SekcjaKontakt";

/**
 * Najmocniejszy wymóg etapu: formularz renderuje się wizualnie, nie wysyła niczego
 * i nie udaje, że wysłał. R6: asercja na brak konkretnego napisu nie może upaść, bo tego
 * napisu nigdy w kodzie nie było — więc sprawdzamy mechanizm, nie napis.
 */
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

describe("Formularz kontaktowy — nie wysyła i nie udaje", () => {
  it("przycisk wysyłki jest nieaktywny", () => {
    zamontuj();
    expect(screen.getByRole("button", { name: /Wyślij zgłoszenie/ })).toBeDisabled();
  });

  it("pokazuje jawny komunikat o niepodłączeniu, powiązany z przyciskiem", () => {
    zamontuj();
    const komunikat = screen.getByText("Formularz zostanie podłączony w kolejnym etapie.");
    expect(komunikat).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wyślij zgłoszenie/ })).toHaveAttribute(
      "aria-describedby",
      komunikat.id,
    );
  });

  it("próba wysłania nie zmienia widoku ani o jeden węzeł", () => {
    const { container } = zamontuj();
    const formularz = container.querySelector("form");
    expect(formularz).not.toBeNull();
    const przed = container.innerHTML;
    fireEvent.submit(formularz as HTMLFormElement);
    expect(container.innerHTML).toBe(przed);
  });

  it("nie wykonuje żadnego zapytania sieciowego przy próbie wysłania", async () => {
    const user = userEvent.setup();
    const { container } = zamontuj();
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await user.click(screen.getByRole("button", { name: /Wyślij zgłoszenie/ }));
    expect(zapytaniaSieciowe).toEqual([]);
  });

  it("nie renderuje żadnego stanu sukcesu — ani przed, ani po próbie wysłania", () => {
    const { container } = zamontuj();
    expect(screen.getByRole("button", { name: /Wyślij zgłoszenie/ })).toBeDisabled();
    expect(
      screen.getByText("Formularz zostanie podłączony w kolejnym etapie."),
    ).toBeInTheDocument();
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    for (const falsz of [/Dziękujemy/i, /Wysłano/i, /Skontaktujemy się/i, /Wyślij kolejne/i]) {
      expect(screen.queryByText(falsz)).toBeNull();
    }
  });

  it("nie ma odnośnika mailto ani tel", () => {
    const { container } = zamontuj();
    for (const odnosnik of container.querySelectorAll("a")) {
      const href = odnosnik.getAttribute("href") ?? "";
      expect(href.startsWith("mailto:")).toBe(false);
      expect(href.startsWith("tel:")).toBe(false);
    }
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

  it("dane kontaktowe są tekstem, z dopiskiem o przykładowym numerze", () => {
    zamontuj();
    expect(screen.getByText("szkolenia@iskt.pl")).toBeInTheDocument();
    expect(screen.getByText(/\+48 32 000 00 00/)).toBeInTheDocument();
    expect(screen.getByText("Numer przykładowy")).toBeInTheDocument();
    expect(screen.getByText("Żory, woj. śląskie")).toBeInTheDocument();
  });
});
