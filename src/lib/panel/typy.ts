import type { KategoriaSzkolenia, ModulProgramu, Szkolenie } from "@/lib/szkolenia/typy";

export const STATUSY_TRESCI = ["draft", "published"] as const;
export type StatusTresci = (typeof STATUSY_TRESCI)[number];

export const IKONY_OBSZAROW = ["cpu", "leaf", "languages", "code-xml", "flask-conical"] as const;

export const ROLE_PANELU = ["admin", "editor"] as const;
export type RolaPanelu = (typeof ROLE_PANELU)[number];

/** Wiersz tabeli public.szkolenia w nazwach kolumn bazy. */
export type SzkolenieWiersz = {
  id: string;
  sort_order: number;
  cat: KategoriaSzkolenia;
  icon: Szkolenie["icon"];
  title: string;
  level: string;
  hours: string;
  format: string;
  price: number;
  badge: string | null;
  fundable: boolean;
  opis: string;
  learn: string[];
  program: ModulProgramu[];
  for_whom: string;
  terms: string[] | null;
  status: StatusTresci;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

/** Szkolenie w panelu: model widoków rozszerzony o pola redakcyjne. */
export type SzkoleniePanel = Szkolenie & {
  sortOrder: number;
  status: StatusTresci;
  publishedAt: string | null;
};

export type Doswiadczenie = { period: string; title: string; org: string; desc: string };
export type Wyksztalcenie = { title: string; org: string };

/** Wiersz tabeli public.trenerzy w nazwach kolumn bazy. */
export type TrenerWiersz = {
  id: string;
  sort_order: number;
  name: string;
  initials: string;
  role: string;
  areas: KategoriaSzkolenia[];
  tagline: string;
  bio: string;
  experience: Doswiadczenie[];
  education: Wyksztalcenie[];
  skills: string[];
  photo_url: string | null;
  status: StatusTresci;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

/** Trener w panelu. */
export type TrenerPanel = {
  id: string;
  sortOrder: number;
  name: string;
  initials: string;
  role: string;
  areas: KategoriaSzkolenia[];
  tagline: string;
  bio: string;
  experience: Doswiadczenie[];
  education: Wyksztalcenie[];
  skills: string[];
  photoUrl: string | null;
  status: StatusTresci;
  publishedAt: string | null;
};

/** Filtr list panelu. */
export type FiltrPanelu = { status?: StatusTresci | "wszystkie"; fraza?: string };
