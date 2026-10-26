export const KATEGORIE_SZKOLEN = ["AI", "ESG", "Angielski", "Software", "B+R"] as const;
export type KategoriaSzkolenia = (typeof KATEGORIE_SZKOLEN)[number];
export type ModulProgramu = { n: string; t: string };
export type Szkolenie = {
  id: string;
  cat: KategoriaSzkolenia;
  icon: "cpu" | "leaf" | "languages" | "code-xml" | "flask-conical";
  title: string;
  level: string;
  hours: string;
  format: string;
  /** Pełna cena w PLN brutto. Liczba — formatowanie należy do warstwy widoku. */
  price: number;
  badge: string | null;
  fundable: boolean;
  desc: string;
  learn: string[];
  program: ModulProgramu[];
  forWhom: string;
  /** Terminy własne szkolenia. Brak oznacza terminy domyślne z adaptera. */
  terms?: string[];
};
export type FiltrSzkolen = {
  kategoria?: KategoriaSzkolenia | "Wszystkie";
  q?: string;
  /** Przełącznik demonstracyjny WYŁĄCZNIE warstwy mock; znika razem z jej podmianą. */
  demo?: "ladowanie" | "blad";
};
