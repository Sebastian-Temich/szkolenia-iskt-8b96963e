import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reguła ogólna, która zastąpiła D9 (ISK-52, decyzja Opcji A z ISK-50 rew. 2).
 *
 * D9 pilnowała jednej nazwy klasy i liczyła kontrast wyłącznie na białym tle, więc nie
 * widziała ani aliasu `text-muted-foreground`, ani drugiego motywu. Tu obowiązuje zamiast niej:
 *
 *   Każdy token stojący pod tekstem ma definicję w obu motywach i w obu osiąga ≥ 4,5:1
 *   względem powierzchni, na której z definicji stoi.
 *
 * Tokeny rozwiązywane są z arkusza, nie z renderu, i nie ma tu żadnej przypiętej ścieżki
 * pliku — ISK-32 usunęło właśnie tę kruchą konstrukcję. Zbiór tokenów bierze się ze skanu
 * źródeł: to, czego nikt nie użył, reguły nie obciąża.
 *
 * D9 wychodzi z reguły sama: `--text-muted` to #7E857A, czyli 3,80:1 na białym. Gdyby ktoś
 * postawił go pod tekstem, trafi do zbioru i reguła padnie — bez wymieniania nazwy tokenu.
 */

const KORZEN = join(import.meta.dirname, "..");
const ARKUSZ = readFileSync(join(KORZEN, "styles.css"), "utf8");
const PROG_AA = 4.5;

/* ---------------------------------------------------------------- arkusz */

function blok(selektor: string): string {
  const otwarcie = new RegExp(`^${selektor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`, "m");
  const start = ARKUSZ.match(otwarcie);
  if (!start?.index) throw new Error(`Nie znaleziono bloku ${selektor} w styles.css.`);
  const poczatek = start.index + start[0].length;
  const koniec = ARKUSZ.indexOf("\n}", poczatek);
  if (koniec < 0) throw new Error(`Blok ${selektor} nie jest domknięty.`);
  return ARKUSZ.slice(poczatek, koniec);
}

/** Grupa dopasowania jako string — regexp jej wymaga, więc brak oznacza błąd w regule, nie dane. */
function grupa(dopasowanie: RegExpMatchArray | RegExpExecArray, numer: number): string {
  const wartosc = dopasowanie[numer];
  if (wartosc === undefined) throw new Error(`Brak grupy ${numer} w dopasowaniu.`);
  return wartosc;
}

function deklaracje(tresc: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const dopasowanie of tresc.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    // Komentarz za wartością (/* 8,71 */) nie należy do wartości tokenu.
    mapa.set(
      grupa(dopasowanie, 1),
      grupa(dopasowanie, 2)
        .replace(/\/\*.*$/s, "")
        .trim(),
    );
  }
  return mapa;
}

const NADPISANIA_CIEMNE = deklaracje(blok(".dark"));
const MOTYWY = { jasny: deklaracje(blok(":root")), ciemny: new Map<string, string>() };
MOTYWY.ciemny = new Map([...MOTYWY.jasny, ...NADPISANIA_CIEMNE]);
type Motyw = keyof typeof MOTYWY;

/** Utility Tailwinda `text-<rola>` bierze się z @theme inline, nie z listy wpisanej ręcznie. */
const UTILITY = new Map(
  [...deklaracje(blok("@theme inline"))]
    .map(([zmienna, wartosc]) => [zmienna, /^var\((--[a-z0-9-]+)\)$/.exec(wartosc)?.[1]] as const)
    .filter((para): para is readonly [string, string] => Boolean(para[1]))
    .map(([zmienna, token]) => [`text-${zmienna.replace("--color-", "")}`, token]),
);

/** Nazwy tokenów, przez które przechodzi rozwiązanie — bez wartości końcowej. */
function lancuch(token: string, motyw: Motyw, glebokosc = 0): string[] {
  if (glebokosc > 12) throw new Error(`Cykl w definicji tokenu ${token}.`);
  const dalej = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(MOTYWY[motyw].get(token) ?? "")?.[1];
  return dalej ? [token, ...lancuch(dalej, motyw, glebokosc + 1)] : [token];
}

function rozwiaz(token: string, motyw: Motyw, glebokosc = 0): string | null {
  if (glebokosc > 12) throw new Error(`Cykl w definicji tokenu ${token}.`);
  const wartosc = MOTYWY[motyw].get(token);
  if (wartosc === undefined) return null;
  const przekierowanie = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(wartosc);
  if (przekierowanie) return rozwiaz(grupa(przekierowanie, 1), motyw, glebokosc + 1);
  return wartosc;
}

/* -------------------------------------------------------------- kontrast */

function luminancja(kolor: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(kolor))
    throw new Error(`Nieprawidłowy kolor szesnastkowy: ${kolor}.`);
  return (
    [
      [1, 0.2126],
      [3, 0.7152],
      [5, 0.0722],
    ] as const
  ).reduce((suma, [poczatek, waga]) => {
    const kanal = parseInt(kolor.slice(poczatek, poczatek + 2), 16) / 255;
    return suma + (kanal <= 0.04045 ? kanal / 12.92 : ((kanal + 0.055) / 1.055) ** 2.4) * waga;
  }, 0);
}

/** WCAG 2.1: (jaśniejszy + 0,05) / (ciemniejszy + 0,05) po korekcie gamma. */
function kontrast(pierwszy: string, drugi: string): number {
  const a = luminancja(pierwszy);
  const b = luminancja(drugi);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* ----------------------------------------------- co stoi pod jakim tłem */

/** Rola `--X-foreground` stoi na `--X`; tokeny „on-" na swojej nazwanej powierzchni. */
const POWIERZCHNIA_WLASNA = new Map<string, string>([
  ["--foreground", "--background"],
  ["--text-on-brand", "--surface-brand"],
  ["--text-on-dark", "--surface-dark"],
  ...[...MOTYWY.jasny.keys()]
    .map((token) => /^(--[a-z0-9-]+)-foreground$/.exec(token))
    .filter((trafienie): trafienie is RegExpExecArray => Boolean(trafienie))
    .filter((trafienie) => MOTYWY.jasny.has(grupa(trafienie, 1)))
    .map((trafienie) => [grupa(trafienie, 0), grupa(trafienie, 1)] as [string, string]),
]);

/** Pozostałe tokeny pod tekstem stoją na powierzchni strony albo karty. */
const POWIERZCHNIE_DOMYSLNE = ["--surface-page", "--surface-card"];

/** Skale surowej palety z WARSTWY 1 — są z założenia ślepe na motyw i arkusz ich nie naprawi. */
const SUROWA_PALETA = /^--(green|ink|neutral|success|warning|error|info)-\d+$/;

function plikiZrodel(katalog: string): string[] {
  return readdirSync(katalog).flatMap((wpis) => {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) return plikiZrodel(sciezka);
    return /\.tsx?$/.test(wpis) && !/\.test\.tsx?$/.test(wpis) ? [sciezka] : [];
  });
}

type Uzycie = { token: string; plik: string };

function tokenyPodTekstem(): Uzycie[] {
  const uzycia: Uzycie[] = [];

  for (const sciezka of plikiZrodel(KORZEN)) {
    const plik = relative(KORZEN, sciezka);
    for (const linia of readFileSync(sciezka, "utf8").split("\n")) {
      // Element dekoracyjny (ikona z pointer-events-none) ma próg 3:1, nie 4,5:1 — poza regułą.
      if (linia.includes("pointer-events-none")) continue;
      for (const dopasowanie of linia.matchAll(/text-\[var\((--[a-z0-9-]+)\)\]/g)) {
        uzycia.push({ token: grupa(dopasowanie, 1), plik });
      }
      for (const [utility, token] of UTILITY) {
        if (new RegExp(`(^|[^a-zA-Z0-9/_-])${utility}(?![a-z0-9-])`).test(linia)) {
          uzycia.push({ token, plik });
        }
      }
    }
  }

  // Baza typograficzna maluje stronę z arkusza: body i h1–h6 są przypięte do --text-primary.
  // Regułę pomijamy tam, gdzie reguła CSS deklaruje własne tło (np. ::selection) — para jest
  // wtedy samowystarczalna i nie zależy od powierzchni strony.
  for (const regula of ARKUSZ.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const cialo = grupa(regula, 2);
    if (/background[^:]*:\s*var\(/.test(cialo)) continue;
    const selektor = grupa(regula, 1).trim().split("\n").pop()?.trim() ?? "?";
    for (const dopasowanie of cialo.matchAll(/(?<!-)color\s*:\s*var\((--[a-z0-9-]+)\)/g)) {
      uzycia.push({ token: grupa(dopasowanie, 1), plik: `styles.css (${selektor})` });
    }
  }

  return uzycia;
}

const UZYCIA = tokenyPodTekstem();

type Naruszenie = { token: string; motyw: Motyw; tlo: string; kontrast: number | null };

function naruszenia(token: string): Naruszenie[] {
  const tla = POWIERZCHNIA_WLASNA.get(token)
    ? [POWIERZCHNIA_WLASNA.get(token) as string]
    : POWIERZCHNIE_DOMYSLNE;
  const wynik: Naruszenie[] = [];

  for (const motyw of ["jasny", "ciemny"] as const) {
    const przod = rozwiaz(token, motyw);
    if (przod === null) {
      wynik.push({ token, motyw, tlo: "—", kontrast: null });
      continue;
    }
    if (!przod.startsWith("#")) continue; // rgba / color-mix — poza zasięgiem rachunku
    for (const nazwaTla of tla) {
      const tlo = rozwiaz(nazwaTla, motyw);
      if (tlo === null || !tlo.startsWith("#")) continue;
      const wartosc = kontrast(przod, tlo);
      if (wartosc < PROG_AA) wynik.push({ token, motyw, tlo: nazwaTla, kontrast: wartosc });
    }
  }
  return wynik;
}

function opis({ token, motyw, tlo, kontrast: wartosc }: Naruszenie): string {
  return wartosc === null
    ? `${token}: brak definicji w motywie ${motyw}`
    : `${token} na ${tlo} w motywie ${motyw} = ${wartosc.toFixed(2)}`;
}

/**
 * Rejestr długu: naruszenia znane, zmierzone i rozpisane na kartę następczą.
 * Trzymany po TOKENACH, nie po ścieżkach plików — nazwa tokenu jest własnością systemu
 * projektowego, ścieżka pliku nie. Warunek jest „zawieraniem", nie równością, więc naprawa
 * pozycji z rejestru nie zapala testu; dopisanie nowej przyczyny — tak.
 */
const DLUG_SEMANTYCZNY = new Set([
  // --error-500 (#B23B2E) jest ślepy na motyw: 3,14 na --ink-900 i 2,83 na --ink-800.
  // Naprawa wymaga decyzji o kolorze statusu marki (--destructive jest też tłem przycisku,
  // z białym --destructive-foreground na sobie), więc nie mieści się w Opcji A.
  "--destructive",
]);

describe("Kontrast tekstu w obu motywach", () => {
  it("rozpoznaje utility i liczy kontrast tak jak WCAG 2.1", () => {
    // Kontrola pozytywna: bez niej reguła mogłaby przechodzić dlatego, że nic nie widzi.
    expect(UTILITY.get("text-muted-foreground")).toBe("--muted-foreground");
    expect(UTILITY.get("text-foreground")).toBe("--foreground");
    expect(new Set(UZYCIA.map((u) => u.token)).size).toBeGreaterThanOrEqual(10);
    expect(kontrast("#5b6157", "#ffffff")).toBeCloseTo(6.38, 2);
    expect(kontrast("#7e857a", "#ffffff")).toBeCloseTo(3.8, 2);
    expect(kontrast("#0e1511", "#0e1511")).toBeCloseTo(1, 2);
  });

  it("każdy token semantyczny pod tekstem ma definicję w obu motywach i w obu osiąga AA", () => {
    const tokeny = [...new Set(UZYCIA.map((u) => u.token))].filter((t) => !SUROWA_PALETA.test(t));
    const zle = tokeny
      .filter((token) => !DLUG_SEMANTYCZNY.has(token))
      .flatMap(naruszenia)
      .map(opis);
    expect(zle).toEqual([]);
  });

  it("surowa paleta nie rozszerza się pod tekstem ponad zmierzony dług", () => {
    // Paleta nie jest warstwą semantyczną i nie przełącza się z motywem, więc arkusz jej nie
    // naprawi — to naruszenie warstwowania, nie kontrastu, i ma własną kartę następczą.
    // Pułap, nie równość: przeniesienie pliku na token semantyczny ma trzymać test zielonym.
    const palety = UZYCIA.filter((u) => SUROWA_PALETA.test(u.token));
    const pliki = new Set(palety.map((u) => u.plik));
    const ZMIERZONY_DLUG = [
      "--green-200",
      "--green-300",
      "--green-600",
      "--green-800",
      "--ink-800",
      "--neutral-400",
    ];
    expect(pliki.size).toBeLessThanOrEqual(18);
    expect(
      [...new Set(palety.map((u) => u.token))].filter((t) => !ZMIERZONY_DLUG.includes(t)),
    ).toEqual([]);
  });

  it("tekstowy token oparty na skali neutralnej jest zdefiniowany w obu motywach", () => {
    // Druga połowa reguły: token, którego wartość bierze się ze skali neutralnej albo ink, jest
    // czuły na motyw z konstrukcji — skale te odwracają się razem z tłem. Musi więc powiedzieć,
    // czym jest w każdym motywie, nawet zanim ktokolwiek go użyje. Rodzina --text-on-* jest
    // wyłączona: nazywa swoją powierzchnię, więc z definicji się nie przełącza.
    const SKALA_CZULA = /^--(neutral|ink)-\d+$/;
    const czule = [...MOTYWY.jasny.keys()]
      .filter((token) => /^--text-/.test(token) && !/^--text-on-/.test(token))
      .filter((token) => lancuch(token, "jasny").some((ogniwo) => SKALA_CZULA.test(ogniwo)));

    // Kontrola pozytywna: zbiór nie może być pusty, bo pusty przechodzi bez pracy.
    expect(czule).toEqual(["--text-primary", "--text-secondary", "--text-muted"]);
    expect(czule.filter((token) => !NADPISANIA_CIEMNE.has(token))).toEqual([]);
  });

  it("nie zmienia wartości tokenów marki w arkuszu", () => {
    // Odczyt jawnie z :root — od ISK-52 trzy z tych tokenów mają drugą definicję w .dark.
    const wJasnym = (token: string) => rozwiaz(token, "jasny")?.toLowerCase();
    expect(wJasnym("--neutral-500")).toBe("#7e857a");
    expect(wJasnym("--neutral-600")).toBe("#5b6157");
    expect(wJasnym("--text-muted")).toBe("#7e857a");
    expect(wJasnym("--text-secondary")).toBe("#5b6157");
  });
});
