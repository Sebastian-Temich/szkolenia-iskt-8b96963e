import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SekcjaKontakt } from "@/components/strona-glowna/SekcjaKontakt";
import {
  KATEGORIE_KOMPETENCJI,
  krokiProcesu,
  trescHero,
  trescKontaktu,
  wybierzPolecane,
} from "@/components/strona-glowna/tresci";
import { KATEGORIE_SZKOLEN, type Szkolenie } from "@/lib/szkolenia/adapter";

const s = (id: string) => ({ id }) as Szkolenie;

describe("Strona główna", () => {
  it("mapuje treść hero dla obu odbiorców", () => {
    expect(trescHero("individual")).toMatchObject({
      eyebrow: "Szkolenia ISKT",
      naglowek: "Rozwijaj kompetencje przyszłości.",
      cta: "Zapisz się na szkolenie",
    });
    expect(trescHero("individual").wsparcie).toContain("Ucz się w swoim tempie");
    expect(trescHero("company")).toMatchObject({
      eyebrow: "Szkolenia dla firm",
      naglowek: "Podnieś kompetencje całego zespołu.",
      cta: "Zapytaj o szkolenie dla firmy",
    });
    expect(trescHero("company").wsparcie).toContain("Szkolenia szyte na miarę");
  });
  it("mapuje cztery kroki procesu", () => {
    for (const o of ["individual", "company"] as const) {
      expect(krokiProcesu(o).kroki.map((k) => k.nr)).toEqual(["01", "02", "03", "04"]);
    }
    expect(krokiProcesu("individual").kroki[0]?.tytul).toBe("Wybierz szkolenie");
    expect(krokiProcesu("company").kroki[0]?.tytul).toBe("Analiza potrzeb");
  });
  it("mapuje treść kontaktu", () => {
    expect(trescKontaktu("individual").naglowek).toBe("Zapisz się na szkolenie");
    expect(trescKontaktu("company").naglowek).toBe("Zapytaj o szkolenie dla firmy");
    expect(trescKontaktu("company").wsparcie).toBe(
      "Opowiedz nam o zespole — przygotujemy program i wycenę z dofinansowaniem.",
    );
  });
  it("wybiera polecane w stałej kolejności", () => {
    const lista = ["eng-b2", "python", "fullstack", "esg", "genai"].map(s);
    expect(wybierzPolecane(lista).map((x) => x.id)).toEqual([
      "genai",
      "esg",
      "fullstack",
      "eng-b2",
    ]);
    expect(wybierzPolecane([s("esg"), s("genai")]).map((x) => x.id)).toEqual(["genai", "esg"]);
  });
  it("ma pięć kategorii z KATEGORIE_SZKOLEN", () => {
    expect(KATEGORIE_KOMPETENCJI).toHaveLength(5);
    for (const k of KATEGORIE_KOMPETENCJI) expect(KATEGORIE_SZKOLEN).toContain(k.kategoria);
  });
  // Asercja na brak konkretnego napisu nie mogła upaść, bo tego napisu nigdy w kodzie nie było.
  // Zamiast napisu sprawdzamy mechanizm: próba wysłania nie zmienia widoku o ani jeden węzeł.
  // Pełne pokrycie zachowania formularza dojdzie w części 2 tego zadania.
  it("formularz jest nieaktywny i nie renderuje żadnego stanu sukcesu", () => {
    const { container } = render(
      <SekcjaKontakt odbiorca="individual" onZmiana={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "Wyślij zgłoszenie" })).toBeDisabled();
    expect(
      screen.getByText("Formularz zostanie podłączony w kolejnym etapie."),
    ).toBeInTheDocument();
    const przed = container.innerHTML;
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(container.innerHTML).toBe(przed);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
