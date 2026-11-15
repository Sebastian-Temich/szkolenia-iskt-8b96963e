import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SekcjaKontakt } from "@/components/strona-glowna/SekcjaKontakt";
import { OknoZapisu } from "@/components/szkolenia/OknoZapisu";
import { ADRES_POLITYKI, DANE_FIRMY, POLITYKA } from "@/lib/polityka/tresc";
import { zamontujTrase } from "./harness-routera";
import { atrapaMakiety } from "./atrapa-klienta";
import userEvent from "@testing-library/user-event";

/**
 * W-13 (issue #47): strona /polityka-prywatnosci, odnośnik w stopce, informacja o
 * administratorze i odnośnik w zgodzie formularza (sekcja kontaktu i okno zapisu).
 */
vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);
vi.mock("@/lib/zgloszenia/wyslij", () => ({ wyslijZgloszenie: vi.fn() }));

beforeEach(() => atrapaMakiety());
afterEach(cleanup);

const INFORMACJA =
  "Administratorem Twoich danych jest ISKT Greenovation Sp. z o.o. Przetwarzamy je, aby odpowiedzieć na zgłoszenie. Szczegóły i Twoje prawa: Polityka prywatności.";

/** Tekst szkicu zaakceptowanego przez właściciela, bez nagłówków i znaczników Markdown. */
function szkic() {
  return readFileSync(resolve("docs/00-intake/zrodla/polityka-prywatnosci.md"), "utf8");
}
const bezSpacji = (t: string) => t.replace(/\s+/g, " ").trim();

describe("Trasa /polityka-prywatnosci (W-13/K1)", () => {
  it("routing dopasowuje stronę z nagłówkiem „Polityka prywatności” i datą aktualizacji", async () => {
    await zamontujTrase(ADRES_POLITYKI);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Polityka prywatności" }),
    ).toBeInTheDocument();
    const data = screen.getByText(POLITYKA.aktualizacjaTekst);
    expect(data.tagName).toBe("TIME");
    expect(data.getAttribute("dateTime")).toBe(POLITYKA.aktualizacjaIso);
    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeInTheDocument();
  });

  it("pokazuje wszystkie sekcje szkicu jako nagłówki drugiego poziomu", async () => {
    await zamontujTrase(ADRES_POLITYKI);
    await screen.findByRole("heading", { level: 1, name: "Polityka prywatności" });
    const naglowki = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    for (const linia of szkic()
      .split("\n")
      .filter((l) => l.startsWith("## "))) {
      expect(naglowki).toContain(linia.slice(3));
    }
  });

  it("treść strony to tekst szkicu właściciela (akapity poza danymi firmy)", async () => {
    const { container } = await zamontujTrase(ADRES_POLITYKI);
    await screen.findByRole("heading", { level: 1, name: "Polityka prywatności" });
    const tekstStrony = bezSpacji(container.querySelector("article")?.textContent ?? "");
    // Akapity i punkty szkicu do linii „---” (dalej jest tekst spod formularza), bez nagłówków.
    const fragmenty = (szkic().split("\n---")[0] ?? "")
      .split(/\n\s*\n|\n(?=- )/)
      .map((f) => bezSpacji(f.replace(/^- /, "")))
      .filter((f) => f && !f.startsWith("#") && !f.startsWith("Ostatnia aktualizacja"))
      // Pole „[pełny adres, KRS, NIP — …]” zastępują na stronie dane firmy (#54), więc z akapitu
      // z nawiasem porównujemy części przed nim i po nim. Po e-mailu administratora strona
      // dopisuje telefon (#54), dlatego kropka kończąca fragment nie jest porównywana.
      .flatMap((f) => f.split(/ ?\[[^\]]*\]\.? ?/))
      .filter((f) => f.length > 0)
      .map((f) => f.replace(/\.$/, ""));
    // 7 akapitów, 2 punkty listy w sekcji 3; akapit administratora dzieli się na 2 części.
    expect(fragmenty).toHaveLength(10);
    for (const fragment of fragmenty) {
      expect(tekstStrony, `brak fragmentu szkicu: ${fragment}`).toContain(fragment);
    }
  });

  it("dane firmy (siedziba, NIP, REGON, telefon) pochodzą z jednego miejsca i są widoczne na stronie (#54)", async () => {
    expect(DANE_FIRMY).toMatchObject({
      adres: "Żory, Polska",
      nip: "6511752112",
      regon: "543251405",
      telefon: "+48 504 083 825",
    });
    expect(DANE_FIRMY).not.toHaveProperty("krs");
    await zamontujTrase(ADRES_POLITYKI);
    const sekcja = await screen.findByText(/Administratorem danych osobowych jest/);
    expect(sekcja.textContent).toBe(
      "Administratorem danych osobowych jest ISKT Greenovation Sp. z o.o. z siedzibą w Żorach (adres: Żory, Polska, NIP: 6511752112, REGON: 543251405). Kontakt w sprawach danych osobowych: szkolenia@iskt.pl, tel. +48 504 083 825.",
    );
  });

  it("strona nie zawiera „[do uzupełnienia]” ani „KRS” (#54)", async () => {
    const { container } = await zamontujTrase(ADRES_POLITYKI);
    await screen.findByRole("heading", { level: 1, name: "Polityka prywatności" });
    const tekstStrony = container.querySelector("article")?.textContent ?? "";
    expect(tekstStrony).not.toContain("[do uzupełnienia]");
    expect(tekstStrony).not.toContain("KRS");
  });

  it("treść polityki nie jest wpisana w komponent trasy", () => {
    const zrodlo = readFileSync(resolve("src/routes/polityka-prywatnosci.tsx"), "utf8");
    expect(zrodlo).not.toMatch(/RODO|Administratorem|Resend|UODO/);
  });
});

describe("Stopka (W-13/K1)", () => {
  it("„Polityka prywatności” prowadzi do /polityka-prywatnosci, a „Regulamin” zostaje tekstem", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const stopka = within(container.querySelector("footer") as HTMLElement);
    expect(stopka.getByRole("link", { name: "Polityka prywatności" }).getAttribute("href")).toBe(
      "/polityka-prywatnosci",
    );
    expect(stopka.queryByRole("link", { name: /Regulamin/ })).toBeNull();
    expect(stopka.getByText(/Regulamin/)).toBeInTheDocument();
  });

  it("telefon w stopce to odnośnik tel:+48504083825 bez dopisku „Numer przykładowy” (#54)", async () => {
    const { container } = await zamontujTrase("/szkolenia");
    const element = container.querySelector("footer") as HTMLElement;
    const telefon = within(element).getByRole("link", { name: "+48 504 083 825" });
    expect(telefon.getAttribute("href")).toBe("tel:+48504083825");
    expect(element.textContent).not.toContain("Numer przykładowy");
    expect(element.textContent).not.toContain("32 000 00 00");
  });

  it("klik w odnośnik stopki otwiera stronę polityki", async () => {
    const user = userEvent.setup();
    const { container, router } = await zamontujTrase("/szkolenia");
    const stopka = within(container.querySelector("footer") as HTMLElement);
    await user.click(stopka.getByRole("link", { name: "Polityka prywatności" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Polityka prywatności" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/polityka-prywatnosci");
  });
});

describe("Formularz w sekcji kontaktu (W-13/K2)", () => {
  it("pod zgodą jest informacja o administratorze z odnośnikiem do polityki", () => {
    const { container } = render(
      <SekcjaKontakt odbiorca="individual" onZmiana={() => undefined} />,
    );
    const informacja = screen.getByText(/Administratorem Twoich danych jest/);
    expect(bezSpacji(informacja.textContent ?? "")).toBe(INFORMACJA);
    const odnosnik = within(informacja).getByRole("link", { name: "Polityka prywatności" });
    expect(odnosnik.getAttribute("href")).toBe("/polityka-prywatnosci");
    // Informacja stoi pod zgodą (po polu wyboru w kolejności dokumentu).
    const zgoda = container.querySelector('input[name="zgoda"]') as HTMLElement;
    expect(
      zgoda.compareDocumentPosition(informacja) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("„polityką prywatności” w zgodzie to odnośnik do /polityka-prywatnosci w tej samej karcie", () => {
    render(<SekcjaKontakt odbiorca="individual" onZmiana={() => undefined} />);
    const odnosnik = screen.getByRole("link", { name: "polityką prywatności" });
    expect(odnosnik.getAttribute("href")).toBe("/polityka-prywatnosci");
    expect(odnosnik.hasAttribute("target")).toBe(false);
    expect(odnosnik.closest("label")?.textContent).toBe(
      "Wyrażam zgodę na kontakt w sprawie zgłoszenia zgodnie z polityką prywatności ISKT Greenovation.",
    );
  });
});

describe("Formularz w oknie zapisu (W-13/K2)", () => {
  const otworzOkno = async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OknoZapisu wariant="individual">
          <button type="button">Zapisz się</button>
        </OknoZapisu>
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Zapisz się" }));
    return screen.findByRole("dialog");
  };

  it("pod zgodą jest informacja o administratorze, a odnośniki otwierają nową kartę", async () => {
    const okno = within(await otworzOkno());
    const informacja = okno.getByText(/Administratorem Twoich danych jest/);
    expect(bezSpacji(informacja.textContent ?? "")).toContain(
      "Administratorem Twoich danych jest ISKT Greenovation Sp. z o.o.",
    );
    const odnosniki = [
      okno.getByRole("link", { name: /^polityką prywatności/ }),
      okno.getByRole("link", { name: /^Polityka prywatności/ }),
    ];
    for (const odnosnik of odnosniki) {
      expect(odnosnik.getAttribute("href")).toBe("/polityka-prywatnosci");
      expect(odnosnik.getAttribute("target")).toBe("_blank");
      expect(odnosnik.getAttribute("rel")).toBe("noopener noreferrer");
      expect(odnosnik.textContent).toContain("(otwiera się w nowej karcie)");
    }
  });
});
