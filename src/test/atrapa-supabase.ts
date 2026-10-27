/**
 * Atrapa klienta bazy w pamięci, zgodna z wycinkiem API używanym przez panel.
 * Każde wykonane zapytanie trafia do `wywolania` razem z tabelą, operacją, wierszem i filtrami.
 */

type Wiersz = Record<string, unknown>;
export type Operacja = "select" | "insert" | "update" | "delete" | "rpc";
export type Filtr = { kolumna: string; operator: "eq" | "in"; wartosc: unknown };
export type Wywolanie = {
  tabela: string;
  operacja: Operacja;
  wiersz?: unknown;
  filtry: Filtr[];
};
/** Sterowanie odpowiedzią tabeli: normalnie, błąd ogólny, odmowa RLS albo zawieszenie. */
export type TrybTabeli = "ok" | "blad" | "odmowa" | "wisi";
type Wynik = { data: unknown; error: unknown };
type Sesja = { user: { email: string }; access_token: string };

const BLAD_OGOLNY = { message: "internal: connection reset by peer", code: "XX000" };
const BLAD_ODMOWY = { message: "new row violates row-level security policy", code: "42501" };
const NIGDY = () => new Promise<never>(() => {});

export function utworzAtrape(poczatek: Partial<Record<string, Wiersz[]>> = {}) {
  const dane: Record<string, Wiersz[]> = {
    szkolenia: [],
    trenerzy: [],
    szkolenie_trener: [],
  };
  for (const [t, w] of Object.entries(poczatek)) dane[t] = structuredClone(w ?? []);
  const wywolania: Wywolanie[] = [];
  const sterowanie = {
    tryby: {} as Record<string, TrybTabeli>,
    rpc: { moje_role: { data: ["editor"], error: null } } as Record<string, Wynik | "wisi">,
    sesja: null as Sesja | null,
    sesjaWisi: false,
    haslo: "poprawne-haslo",
  };
  const sluchacze = new Set<(zdarzenie: string, s: Sesja | null) => void>();

  function pasuje(w: Wiersz, filtry: Filtr[]) {
    return filtry.every((f) =>
      f.operator === "eq"
        ? w[f.kolumna] === f.wartosc
        : Array.isArray(f.wartosc) && f.wartosc.includes(w[f.kolumna]),
    );
  }

  function zapytanie(tabela: string) {
    let operacja: Operacja = "select";
    let wiersz: unknown;
    const filtry: Filtr[] = [];
    let sortuj: string | null = null;
    let tryb: "wiele" | "jeden" | "jedenLubNic" = "wiele";

    function wykonaj(): Promise<Wynik> {
      wywolania.push({ tabela, operacja, wiersz: structuredClone(wiersz), filtry: [...filtry] });
      const t = sterowanie.tryby[tabela] ?? "ok";
      if (t === "wisi") return NIGDY();
      if (t === "blad") return Promise.resolve({ data: null, error: BLAD_OGOLNY });
      if (t === "odmowa") return Promise.resolve({ data: null, error: BLAD_ODMOWY });
      const zbior = (dane[tabela] ??= []);
      if (operacja === "insert") {
        const nowe = (Array.isArray(wiersz) ? wiersz : [wiersz]) as Wiersz[];
        zbior.push(...structuredClone(nowe));
        return Promise.resolve({ data: null, error: null });
      }
      if (operacja === "update") {
        zbior.filter((w) => pasuje(w, filtry)).forEach((w) => Object.assign(w, wiersz));
        return Promise.resolve({ data: null, error: null });
      }
      if (operacja === "delete") {
        dane[tabela] = zbior.filter((w) => !pasuje(w, filtry));
        return Promise.resolve({ data: null, error: null });
      }
      let wynik = structuredClone(zbior.filter((w) => pasuje(w, filtry)));
      if (sortuj) {
        const k = sortuj;
        wynik = wynik.sort((a, b) => Number(a[k]) - Number(b[k]));
      }
      if (tryb === "wiele") return Promise.resolve({ data: wynik, error: null });
      const pierwszy = wynik[0] ?? null;
      if (tryb === "jeden" && !pierwszy) {
        return Promise.resolve({ data: null, error: { message: "no rows", code: "PGRST116" } });
      }
      return Promise.resolve({ data: pierwszy, error: null });
    }

    const budowniczy = {
      select: () => budowniczy,
      insert: (w: unknown) => ((operacja = "insert"), (wiersz = w), budowniczy),
      update: (w: unknown) => ((operacja = "update"), (wiersz = w), budowniczy),
      delete: () => ((operacja = "delete"), budowniczy),
      eq: (kolumna: string, wartosc: unknown) => (
        filtry.push({ kolumna, operator: "eq", wartosc }),
        budowniczy
      ),
      in: (kolumna: string, wartosc: unknown[]) => (
        filtry.push({ kolumna, operator: "in", wartosc }),
        budowniczy
      ),
      order: (kolumna: string) => ((sortuj = kolumna), budowniczy),
      single: () => ((tryb = "jeden"), budowniczy),
      maybeSingle: () => ((tryb = "jedenLubNic"), budowniczy),
      then: <A, B>(ok: (w: Wynik) => A, nie?: (e: unknown) => B) => wykonaj().then(ok, nie),
    };
    return budowniczy;
  }

  function powiadom(zdarzenie: string) {
    sluchacze.forEach((s) => s(zdarzenie, sterowanie.sesja));
  }

  const klient = {
    from: (tabela: string) => zapytanie(tabela),
    rpc: (nazwa: string) => {
      wywolania.push({ tabela: nazwa, operacja: "rpc", filtry: [] });
      const w = sterowanie.rpc[nazwa] ?? { data: null, error: BLAD_OGOLNY };
      return w === "wisi" ? NIGDY() : Promise.resolve(w);
    },
    auth: {
      getSession: () =>
        sterowanie.sesjaWisi
          ? NIGDY()
          : Promise.resolve({ data: { session: sterowanie.sesja }, error: null }),
      onAuthStateChange: (cb: (zdarzenie: string, s: Sesja | null) => void) => {
        sluchacze.add(cb);
        return { data: { subscription: { unsubscribe: () => sluchacze.delete(cb) } } };
      },
      signInWithPassword: ({ email, password }: { email: string; password: string }) => {
        if (password !== sterowanie.haslo) {
          return Promise.resolve({
            data: { session: null, user: null },
            error: { message: "Invalid login credentials", status: 400 },
          });
        }
        sterowanie.sesja = { user: { email }, access_token: "atrapa" };
        powiadom("SIGNED_IN");
        return Promise.resolve({
          data: { session: sterowanie.sesja, user: sterowanie.sesja.user },
          error: null,
        });
      },
      signOut: () => {
        sterowanie.sesja = null;
        powiadom("SIGNED_OUT");
        return Promise.resolve({ error: null });
      },
    },
  };

  return {
    klient,
    dane,
    wywolania,
    sterowanie,
    /** Wywołania danej operacji na danej tabeli. */
    gdzie: (tabela: string, operacja: Operacja) =>
      wywolania.filter((w) => w.tabela === tabela && w.operacja === operacja),
    /** Wywołania odczytu tabel danych (bez RPC i autoryzacji). */
    zapytaniaODane: () => wywolania.filter((w) => w.operacja !== "rpc"),
  };
}

export type Atrapa = ReturnType<typeof utworzAtrape>;

/** Wiersz szkolenia w kształcie kolumn bazy. */
export function wierszSzkolenia(nadpisz: Wiersz = {}): Wiersz {
  return {
    id: "genai",
    sort_order: 1,
    cat: "AI",
    icon: "cpu",
    title: "Generatywne AI dla biznesu",
    level: "Podstawowy",
    hours: "16 h",
    format: "Online",
    price: 1490,
    badge: null,
    fundable: true,
    opis: "Opis szkolenia.",
    learn: ["Efekt 1", "Efekt 2", "Efekt 3", "Efekt 4"],
    program: [{ n: "01", t: "Wprowadzenie" }],
    for_whom: "Dla zespołów.",
    terms: null,
    status: "published",
    published_at: "2026-10-01T10:00:00.000Z",
    ...nadpisz,
  };
}

/** Wiersz trenera w kształcie kolumn bazy. */
export function wierszTrenera(nadpisz: Wiersz = {}): Wiersz {
  return {
    id: "anna-nowak",
    sort_order: 1,
    name: "Anna Nowak",
    initials: "AN",
    role: "Trenerka AI",
    areas: ["AI"],
    tagline: "Praktyczne AI.",
    bio: "Biogram.",
    experience: [],
    education: [],
    skills: [],
    photo_url: null,
    status: "published",
    published_at: "2026-10-01T10:00:00.000Z",
    ...nadpisz,
  };
}
