import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SekcjaKontakt } from "@/components/strona-glowna/SekcjaKontakt";
import type { WynikZgloszenia } from "@/lib/zgloszenia/obsluga";

/**
 * Issue #46 (W-12, „Było → ma być”): formularz na stronie głównej (`/#kontakt`) wysyła
 * zgłoszenie przez funkcję serwerową `wyslijZgloszenie`. Podmieniona jest tylko ta funkcja
 * (granica sieci); walidacja, stany ekranu i fokus to prawdziwy kod formularza.
 */
const wyslij = vi.hoisted(() =>
  vi.fn<(arg: { data: Record<string, unknown> }) => Promise<WynikZgloszenia>>(),
);
vi.mock("@/lib/zgloszenia/wyslij", () => ({ wyslijZgloszenie: wyslij }));

beforeEach(() => {
  wyslij.mockReset();
  wyslij.mockResolvedValue({ wynik: "ok" });
});
afterEach(() => cleanup());

const zamontuj = (odbiorca: "individual" | "company" = "individual") =>
  render(<SekcjaKontakt odbiorca={odbiorca} onZmiana={() => undefined} />);

type Uzytkownik = ReturnType<typeof userEvent.setup>;

async function wypelnij(user: Uzytkownik, zmiany: { email?: string } = {}) {
  await user.type(screen.getByLabelText("Imię i nazwisko"), "Janina Testowa");
  await user.type(screen.getByLabelText("E-mail"), zmiany.email ?? "janina@example.com");
  await user.type(screen.getByLabelText("Telefon"), "+48 600 111 222");
  await user.selectOptions(
    screen.getByLabelText("Interesujące szkolenie / obszar"),
    "Język angielski",
  );
  await user.type(screen.getByLabelText("Wiadomość"), "Proszę o kontakt w sprawie kursu.");
  await user.click(screen.getByRole("checkbox", { name: /Wyrażam zgodę/ }));
}

const przycisk = () => screen.getByRole("button", { name: /Wyślij zgłoszenie|Wysyłam/ });

describe("W-12/K1, K8: wysyłka z /#kontakt", () => {
  it("poprawne dane: jedno wywołanie funkcji serwerowej ze źródłem kontakt i wszystkimi polami", async () => {
    const user = userEvent.setup();
    zamontuj("company");
    await wypelnij(user);
    await user.click(przycisk());
    await screen.findByRole("heading", { name: "Dziękujemy!" });
    expect(wyslij).toHaveBeenCalledTimes(1);
    expect(wyslij.mock.calls[0]?.[0].data).toEqual({
      zrodlo: "kontakt",
      odbiorca: "company",
      imie: "Janina Testowa",
      email: "janina@example.com",
      telefon: "+48 600 111 222",
      szkolenie: undefined,
      szkolenieTytul: undefined,
      obszar: "Język angielski",
      wiadomosc: "Proszę o kontakt w sprawie kursu.",
      zgoda: true,
      strona: "/",
      strona_www: "",
    });
  });

  it("sukces: formularz znika, nagłówek „Dziękujemy!” z fokusem i tekst z karty", async () => {
    const user = userEvent.setup();
    const { container } = zamontuj();
    await wypelnij(user);
    await user.click(przycisk());
    const naglowek = await screen.findByRole("heading", { name: "Dziękujemy!" });
    await waitFor(() => expect(naglowek).toHaveFocus());
    expect(
      screen.getByText("Zgłoszenie dotarło do nas. Odezwiemy się w ciągu 2 dni roboczych."),
    ).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
  });

  it("napis „Formularz zostanie podłączony w kolejnym etapie.” usunięty, przycisk aktywny", () => {
    zamontuj();
    expect(screen.queryByText(/Formularz zostanie podłączony/)).toBeNull();
    expect(przycisk()).toBeEnabled();
  });
});

describe("W-12/K2: walidacja w przeglądarce", () => {
  it("pusty formularz: komunikat z karty przy każdym polu, fokus na imieniu, brak wywołania", async () => {
    const user = userEvent.setup();
    zamontuj();
    await user.click(przycisk());
    const oczekiwane: [string, string][] = [
      ["Imię i nazwisko", "Podaj imię i nazwisko."],
      ["E-mail", "Podaj poprawny adres e-mail."],
      ["Telefon", "Podaj numer telefonu, np. +48 600 000 000."],
      ["Interesujące szkolenie / obszar", "Wybierz szkolenie lub obszar."],
      ["Wiadomość", "Napisz kilka słów o potrzebie (co najmniej 10 znaków)."],
    ];
    for (const [etykieta, komunikat] of oczekiwane) {
      const pole = screen.getByLabelText(etykieta);
      expect(pole).toHaveAttribute("aria-invalid", "true");
      expect(pole).toHaveAccessibleDescription(komunikat);
    }
    expect(screen.getByRole("checkbox", { name: /Wyrażam zgodę/ })).toHaveAccessibleDescription(
      "Zaznacz zgodę, abyśmy mogli odpowiedzieć.",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Uzupełnij zaznaczone pola.");
    expect(screen.getByLabelText("Imię i nazwisko")).toHaveFocus();
    expect(wyslij).not.toHaveBeenCalled();
  });

  it("błędny e-mail przy poprawnych innych polach: fokus na e-mailu, komunikat tylko tam", async () => {
    const user = userEvent.setup();
    zamontuj();
    await wypelnij(user, { email: "janina@" });
    await user.click(przycisk());
    expect(screen.getByLabelText("E-mail")).toHaveFocus();
    expect(screen.getByLabelText("E-mail")).toHaveAccessibleDescription(
      "Podaj poprawny adres e-mail.",
    );
    expect(screen.getByLabelText("Imię i nazwisko")).not.toHaveAttribute("aria-invalid");
    expect(wyslij).not.toHaveBeenCalled();
  });

  it("telefon z za małą liczbą cyfr i za krótka wiadomość są odrzucane", async () => {
    const user = userEvent.setup();
    zamontuj();
    await wypelnij(user);
    await user.clear(screen.getByLabelText("Telefon"));
    await user.type(screen.getByLabelText("Telefon"), "+48 (600)-1");
    await user.clear(screen.getByLabelText("Wiadomość"));
    await user.type(screen.getByLabelText("Wiadomość"), "  krótko  ");
    await user.click(przycisk());
    expect(screen.getByLabelText("Telefon")).toHaveFocus();
    expect(screen.getByLabelText("Wiadomość")).toHaveAttribute("aria-invalid", "true");
    expect(wyslij).not.toHaveBeenCalled();
  });

  it("błąd walidacji z serwera (400) pokazuje komunikat przy polu i fokus", async () => {
    wyslij.mockResolvedValue({ wynik: "walidacja", pola: ["telefon"] });
    const user = userEvent.setup();
    zamontuj();
    await wypelnij(user);
    await user.click(przycisk());
    await waitFor(() => expect(screen.getByLabelText("Telefon")).toHaveFocus());
    expect(screen.getByLabelText("Telefon")).toHaveAccessibleDescription(
      "Podaj numer telefonu, np. +48 600 000 000.",
    );
  });
});

describe("W-12/K6: w trakcie wysyłki", () => {
  it("przycisk „Wysyłam…” zablokowany, ponowne kliknięcie i submit nie wołają drugi raz", async () => {
    let zakoncz: (w: WynikZgloszenia) => void = () => undefined;
    wyslij.mockImplementation(() => new Promise((r) => (zakoncz = r)));
    const user = userEvent.setup();
    const { container } = zamontuj();
    await wypelnij(user);
    await user.click(przycisk());
    const wTrakcie = screen.getByRole("button", { name: "Wysyłam…" });
    expect(wTrakcie).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Wysyłam…");
    await user.click(wTrakcie);
    act(() => {
      container.querySelector("form")?.requestSubmit();
    });
    expect(wyslij).toHaveBeenCalledTimes(1);
    await act(async () => zakoncz({ wynik: "ok" }));
    expect(await screen.findByRole("heading", { name: "Dziękujemy!" })).toBeInTheDocument();
  });
});

describe("W-12/K3, K5: błąd usługi i limit", () => {
  it.each([
    [
      "błąd usługi (502/503)",
      { wynik: "blad" } as WynikZgloszenia,
      "Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę albo napisz do nas: szkolenia@iskt.pl.",
    ],
    [
      "za dużo prób (429)",
      { wynik: "limit" } as WynikZgloszenia,
      "Wysłano już kilka zgłoszeń. Spróbuj ponownie za kilka minut albo napisz do nas: szkolenia@iskt.pl.",
    ],
  ])(
    "%s: komunikat z karty, dane zostają w polach, przycisk znów aktywny",
    async (_, wynik, tekst) => {
      wyslij.mockResolvedValue(wynik);
      const user = userEvent.setup();
      zamontuj();
      await wypelnij(user);
      await user.click(przycisk());
      expect(await screen.findByText(tekst)).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(tekst);
      expect(screen.getByLabelText("Imię i nazwisko")).toHaveValue("Janina Testowa");
      expect(screen.getByLabelText("E-mail")).toHaveValue("janina@example.com");
      expect(screen.getByLabelText("Wiadomość")).toHaveValue("Proszę o kontakt w sprawie kursu.");
      expect(screen.getByRole("checkbox", { name: /Wyrażam zgodę/ })).toBeChecked();
      expect(przycisk()).toBeEnabled();
    },
  );

  it("wyjątek wywołania (np. brak sieci) daje stan błędu, dane zostają", async () => {
    wyslij.mockRejectedValue(new Error("Failed to fetch"));
    const user = userEvent.setup();
    zamontuj();
    await wypelnij(user);
    await user.click(przycisk());
    expect(await screen.findByText(/Nie udało się wysłać zgłoszenia/)).toBeInTheDocument();
    expect(screen.getByLabelText("Telefon")).toHaveValue("+48 600 111 222");
  });
});

describe("Pole-pułapka (R8) i dostępność", () => {
  it("pułapka poza drzewem dostępności i bez fokusu z klawiatury", () => {
    const { container } = zamontuj();
    const pulapka = container.querySelector('input[name="strona_www"]');
    expect(pulapka).not.toBeNull();
    expect(pulapka).toHaveAttribute("tabindex", "-1");
    expect(pulapka?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole("textbox", { name: /Strona www/ })).toBeNull();
  });

  it("wypełniona pułapka jest wysyłana na serwer (serwer odrzuca po cichu)", async () => {
    const user = userEvent.setup();
    const { container } = zamontuj();
    await wypelnij(user);
    const pulapka = container.querySelector('input[name="strona_www"]') as HTMLInputElement;
    await user.type(pulapka, "https://spam.example.com");
    await user.click(przycisk());
    await screen.findByRole("heading", { name: "Dziękujemy!" });
    expect(wyslij.mock.calls[0]?.[0].data["strona_www"]).toBe("https://spam.example.com");
  });

  it("region komunikatów stanu ma aria-live polite", () => {
    zamontuj();
    expect(within(screen.getByRole("status")).queryByText(/./)).toBeNull();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
