/**
 * Jedno miejsce, w którym testy podstawiają klienta bazy. Pliki testowe robią tylko:
 *
 *   vi.mock("@/lib/supabase/klient", async () => (await import("./atrapa-klienta")).modulKlienta);
 *
 * Fabryka `vi.mock` importuje ten moduł, więc nie trzeba `vi.hoisted` w każdym pliku, a
 * stan atrapy zostaje jawnie ustawiany w `beforeEach`.
 */
import type { StanKonfiguracji } from "@/lib/supabase/klient";
import { SZKOLENIA_MOCK } from "@/lib/szkolenia/mock-dane";
import type { Szkolenie } from "@/lib/szkolenia/typy";
import { utworzAtrape, type Atrapa } from "./atrapa-supabase";
import { TRENERZY_MAKIETY, type TrenerMakiety } from "./dane-z-makiety-trenerzy";

type Wiersz = Record<string, unknown>;

export const POWOD_BRAKU_KONFIGURACJI =
  "Brak konfiguracji połączenia z bazą. Uzupełnij zmienne środowiskowe VITE_SUPABASE_URL i VITE_SUPABASE_PUBLISHABLE_KEY.";

/**
 * Przepisuje model makiety na wiersz bazy — odwrotność mapera widoku publicznego.
 * Brak klucza `terms` daje `terms: null`, czyli fallback na terminy domyślne.
 */
export function wierszZeSzkolenia(s: Szkolenie, indeks: number, nadpisz: Wiersz = {}): Wiersz {
  return {
    id: s.id,
    sort_order: indeks + 1,
    cat: s.cat,
    icon: s.icon,
    title: s.title,
    level: s.level,
    hours: s.hours,
    format: s.format,
    price: s.price,
    badge: s.badge,
    fundable: s.fundable,
    opis: s.desc,
    learn: [...s.learn],
    program: s.program.map((m) => ({ ...m })),
    for_whom: s.forWhom,
    terms: s.terms ? [...s.terms] : null,
    status: "published",
    published_at: "2026-10-01T10:00:00.000Z",
    ...nadpisz,
  };
}

/** Przepisuje trenera z makiety na wiersz bazy; makieta nie ma zdjęć, więc `photo_url` jest null. */
export function wierszZTrenera(t: TrenerMakiety, indeks: number, nadpisz: Wiersz = {}): Wiersz {
  return {
    id: t.id,
    sort_order: indeks + 1,
    name: t.name,
    initials: t.initials,
    role: t.role,
    areas: [...t.areas],
    tagline: t.tagline,
    bio: t.bio,
    experience: t.experience.map((e) => ({ ...e })),
    education: t.education.map((e) => ({ ...e })),
    skills: [...t.skills],
    photo_url: null,
    status: "published",
    published_at: "2026-10-01T10:00:00.000Z",
    ...nadpisz,
  };
}

/** Wiersze relacji M:N wyprowadzone z pola `teach` makiety, w jej kolejności. */
export function przypisaniaZMakiety(trenerzy: TrenerMakiety[] = TRENERZY_MAKIETY): Wiersz[] {
  return trenerzy.flatMap((t) =>
    t.teach.map((szkolenieId, i) => ({
      szkolenie_id: szkolenieId,
      trener_id: t.id,
      sort_order: i,
    })),
  );
}

export const WIERSZE_SZKOLEN_MAKIETY = SZKOLENIA_MOCK.map((s, i) => wierszZeSzkolenia(s, i));
export const WIERSZE_TRENEROW_MAKIETY = TRENERZY_MAKIETY.map((t, i) => wierszZTrenera(t, i));

let atrapa: Atrapa | null = null;
let konfiguracja: StanKonfiguracji = { ok: true };

/** Podstawiany moduł klienta bazy. */
export const modulKlienta = {
  stanKonfiguracji: (): StanKonfiguracji => konfiguracja,
  pobierzKlienta: () => {
    if (!atrapa) throw new Error("test: atrapa klienta nie jest ustawiona");
    return atrapa.klient;
  },
};

/** Ustawia atrapę jako źródło danych i przywraca stan „skonfigurowano". */
export function ustawAtrape(nowa: Atrapa): Atrapa {
  atrapa = nowa;
  konfiguracja = { ok: true };
  return nowa;
}

/** Symuluje brak zmiennych środowiskowych w przeglądarce. */
export function ustawBrakKonfiguracji(powod: string = POWOD_BRAKU_KONFIGURACJI): void {
  konfiguracja = { ok: false, powod };
}

/** Bieżąca atrapa — do asercji na wykonanych zapytaniach. */
export function biezacaAtrapa(): Atrapa {
  if (!atrapa) throw new Error("test: atrapa klienta nie jest ustawiona");
  return atrapa;
}

/** Atrapa wypełniona całą treścią makiety: 9 szkoleń, 6 trenerów i ich przypisania. */
export function atrapaMakiety(): Atrapa {
  return ustawAtrape(
    utworzAtrape({
      szkolenia: WIERSZE_SZKOLEN_MAKIETY,
      trenerzy: WIERSZE_TRENEROW_MAKIETY,
      szkolenie_trener: przypisaniaZMakiety(),
    }),
  );
}
