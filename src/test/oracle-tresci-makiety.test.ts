/**
 * Oracle treści strony głównej.
 *
 * Oczekiwania nie są wpisane z pamięci ani przepisane z kodu: każde pochodzi z maszynowego
 * wyciągu z makiety właściciela (`dane-z-makiety-landing.ts`, zrobionego skryptem wprost na
 * `standalone-src.html`). Test porównuje więc kod z materiałem źródłowym, a nie z innym testem.
 *
 * Gdy ten test padnie, domyślnym wnioskiem jest rozbieżność kodu z makietą — nie błąd oracle'a.
 * Zmiana wyciągu wymaga decyzji właściciela o zmianie makiety.
 */
import { describe, expect, it } from "vitest";
import { MAKIETA as makieta } from "./dane-z-makiety-landing";
import {
  KATEGORIE_KOMPETENCJI,
  OPCJE_OBSZARU,
  POLECANE_ID,
  POTWIERDZENIA_HERO,
  SCIEZKI,
  ZRODLA_DOFINANSOWANIA,
  krokiProcesu,
  trescHero,
  trescKontaktu,
  wybierzPolecane,
  type Odbiorca,
} from "@/components/strona-glowna/tresci";
import { KATEGORIE_SZKOLEN, type Szkolenie } from "@/lib/szkolenia/adapter";

const ODBIORCY: Odbiorca[] = ["individual", "company"];
const szk = (id: string) => ({ id }) as Szkolenie;

describe("hero", () => {
  it.each(ODBIORCY)("odwzorowuje makietę dla %s", (odbiorca) => {
    const t = trescHero(odbiorca);
    expect(t.eyebrow).toBe(makieta.heroEyebrow[odbiorca]);
    expect(t.naglowek).toBe(makieta.heroTitle[odbiorca]);
    expect(t.wsparcie).toBe(makieta.heroSub[odbiorca]);
    expect(t.cta).toBe(makieta.heroCta[odbiorca]);
  });

  it("zachowuje kropkę w nagłówku obu wariantów", () => {
    for (const o of ODBIORCY) expect(trescHero(o).naglowek.endsWith(".")).toBe(true);
  });

  it("ma trzy potwierdzenia z makiety, w tej samej kolejności", () => {
    expect(POTWIERDZENIA_HERO).toEqual(makieta.heroChecks.slice(0, 3));
  });

  it("domyślny odbiorca z makiety to individual", () => {
    expect(makieta.audienceDefault).toBe("individual");
  });
});

describe("jak to działa", () => {
  it.each(ODBIORCY)("ma cztery kroki 01-04 dla %s", (odbiorca) => {
    const k = krokiProcesu(odbiorca).kroki;
    expect(k).toHaveLength(4);
    expect(k.map((x) => x.nr)).toEqual(["01", "02", "03", "04"]);
  });

  it("odwzorowuje nagłówek i zdanie wsparcia z makiety", () => {
    for (const o of ODBIORCY) {
      expect(krokiProcesu(o).naglowek).toBe(makieta.processTitle[o]);
      expect(krokiProcesu(o).wsparcie).toBe(makieta.processSub[o]);
    }
  });

  it("odwzorowuje tytuły i opisy wszystkich kroków z makiety", () => {
    const zrodlo = { individual: makieta.procInd, company: makieta.procComp };
    for (const o of ODBIORCY) {
      const k = krokiProcesu(o).kroki;
      expect(k.map((x) => x.tytul)).toEqual(zrodlo[o].map((x) => x.t));
      expect(k.map((x) => x.opis)).toEqual(zrodlo[o].map((x) => x.d));
    }
  });

  it("rozróżnia ścieżki — pierwszy krok firmy to analiza potrzeb", () => {
    expect(krokiProcesu("individual").kroki[0]?.tytul).toBe("Wybierz szkolenie");
    expect(krokiProcesu("company").kroki[0]?.tytul).toBe("Analiza potrzeb");
  });
});

describe("kontakt", () => {
  it.each(ODBIORCY)("odwzorowuje makietę dla %s", (odbiorca) => {
    const t = trescKontaktu(odbiorca);
    expect(t.naglowek).toBe(makieta.contactTitle[odbiorca]);
    expect(t.wsparcie).toBe(makieta.contactSub[odbiorca]);
  });

  it("ma opcje obszaru z makiety, bez pozycji zastępczej", () => {
    expect(OPCJE_OBSZARU).toEqual(makieta.selectOptions.slice(1));
  });
});

describe("najczęściej wybierane", () => {
  it("ma dokładnie cztery identyfikatory z makiety, w tej samej kolejności", () => {
    expect([...POLECANE_ID]).toEqual(makieta.featured);
  });

  it("zachowuje kolejność POLECANE_ID niezależnie od kolejności wejścia", () => {
    const wejscie = [...makieta.featured].reverse().map(szk);
    expect(wybierzPolecane(wejscie).map((s) => s.id)).toEqual(makieta.featured);
  });

  it("pomija identyfikatory nieobecne na liście i nie wstawia dziur", () => {
    const wynik = wybierzPolecane([szk("esg"), szk("genai"), szk("python")]);
    expect(wynik.map((s) => s.id)).toEqual(["genai", "esg"]);
    expect(wynik.every(Boolean)).toBe(true);
  });

  it("zwraca pustą tablicę dla pustego wejścia, bez wyjątku", () => {
    expect(wybierzPolecane([])).toEqual([]);
  });

  it("nie wymyśla szkoleń, gdy adapter zwróci nieznane identyfikatory", () => {
    expect(wybierzPolecane([szk("nie-ma"), szk("tez-nie")])).toEqual([]);
  });
});

describe("kategorie kompetencji", () => {
  it("ma pięć kart odwzorowanych z makiety co do znaku", () => {
    expect(KATEGORIE_KOMPETENCJI).toHaveLength(5);
    expect(KATEGORIE_KOMPETENCJI.map((k) => k.kategoria)).toEqual(
      makieta.categories.map((c) => c.cat),
    );
    expect(KATEGORIE_KOMPETENCJI.map((k) => k.tytul)).toEqual(makieta.categories.map((c) => c.t));
    expect(KATEGORIE_KOMPETENCJI.map((k) => k.opis)).toEqual(makieta.categories.map((c) => c.d));
  });

  it("używa wyłącznie kategorii znanych warstwie danych i obecnych w makiecie", () => {
    for (const k of KATEGORIE_KOMPETENCJI) {
      expect(KATEGORIE_SZKOLEN as readonly string[]).toContain(k.kategoria);
      expect(makieta.filterNames).toContain(k.kategoria);
    }
  });

  it("pokrywa wszystkie pięć kategorii warstwy danych, bez powtórzeń", () => {
    const uzyte = KATEGORIE_KOMPETENCJI.map((k) => k.kategoria);
    expect(new Set(uzyte).size).toBe(5);
    expect([...uzyte].sort()).toEqual([...KATEGORIE_SZKOLEN].sort());
  });

  it("żadna karta nie prowadzi do pozycji Wszystkie", () => {
    for (const k of KATEGORIE_KOMPETENCJI) expect(k.kategoria).not.toBe("Wszystkie");
  });
});

describe("ścieżki odbiorcy", () => {
  it("ma dwie karty z treścią i wypunktowaniami z makiety", () => {
    const sciezki = [SCIEZKI.indywidualna, SCIEZKI.firmowa];
    expect(sciezki.map((s) => s.tytul)).toEqual(makieta.paths.map((p) => p.title));
    expect(sciezki.map((s) => s.opis)).toEqual(makieta.paths.map((p) => p.desc));
    expect(sciezki.map((s) => s.cta)).toEqual(makieta.paths.map((p) => p.cta));
    expect(sciezki.map((s) => [...s.punkty])).toEqual(makieta.paths.map((p) => p.bullets));
  });

  it("karta indywidualna ma cztery punkty, firmowa trzy — jak w makiecie", () => {
    expect(SCIEZKI.indywidualna.punkty).toHaveLength(4);
    expect(SCIEZKI.firmowa.punkty).toHaveLength(3);
  });
});

describe("dofinansowania", () => {
  it("ma trzy źródła odwzorowane z makiety", () => {
    expect(ZRODLA_DOFINANSOWANIA).toHaveLength(3);
    expect(ZRODLA_DOFINANSOWANIA.map((z) => z.skrot)).toEqual(makieta.funding.map((f) => f.tag));
    expect(ZRODLA_DOFINANSOWANIA.map((z) => z.tytul)).toEqual(makieta.funding.map((f) => f.t));
    expect(ZRODLA_DOFINANSOWANIA.map((z) => z.opis)).toEqual(makieta.funding.map((f) => f.d));
  });
});

describe("fundamenty marki w treści strony", () => {
  const teksty: string[] = [
    ...ODBIORCY.flatMap((o) => Object.values(trescHero(o))),
    ...ODBIORCY.flatMap((o) => [krokiProcesu(o).naglowek, krokiProcesu(o).wsparcie]),
    ...ODBIORCY.flatMap((o) => krokiProcesu(o).kroki.flatMap((k) => [k.tytul, k.opis])),
    ...ODBIORCY.flatMap((o) => Object.values(trescKontaktu(o))),
    ...KATEGORIE_KOMPETENCJI.flatMap((k) => [k.tytul, k.opis]),
    ...[SCIEZKI.indywidualna, SCIEZKI.firmowa].flatMap((s) => [
      s.tytul,
      s.opis,
      s.cta,
      ...s.punkty,
    ]),
    ...ZRODLA_DOFINANSOWANIA.flatMap((z) => [z.tytul, z.opis]),
    ...POTWIERDZENIA_HERO,
    ...OPCJE_OBSZARU,
  ].filter((v): v is string => typeof v === "string");

  it("nie używa formy Państwo", () => {
    for (const t of teksty) expect(t).not.toMatch(/Pa[nń]stw/);
  });

  it("nie zawiera emoji ani piktogramów", () => {
    for (const t of teksty) expect(t).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2190}-\u{27BF}]/u);
  });

  it("zachowuje pełną polską diakrytykę", () => {
    const polaczone = teksty.join(" ");
    for (const znak of ["ą", "ę", "ś", "ż", "ź", "ć", "ń", "ó", "ł"]) {
      expect(polaczone).toContain(znak);
    }
  });

  it("nie zawiera obcych wtrętów językowych w treści widocznej", () => {
    for (const t of teksty) expect(t).not.toMatch(/\b(Lorem|TODO|FIXME|placeholder)\b/i);
  });
});
