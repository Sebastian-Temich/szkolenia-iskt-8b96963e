import type { SzkoleniePanel, SzkolenieWiersz, TrenerPanel, TrenerWiersz } from "./typy";

/** Wiersz zapisywany do bazy, bez znaczników czasu nadawanych przez bazę. */
export type SzkolenieDoZapisu = Omit<SzkolenieWiersz, "created_at" | "updated_at">;
export type TrenerDoZapisu = Omit<TrenerWiersz, "created_at" | "updated_at">;

/** Przepisuje wiersz bazy na model; terms: null usuwa klucz, terms: [] zostaje pustą listą. */
export function wierszNaSzkolenie(w: SzkolenieWiersz): SzkoleniePanel {
  return {
    id: w.id,
    sortOrder: w.sort_order,
    cat: w.cat,
    icon: w.icon,
    title: w.title,
    level: w.level,
    hours: w.hours,
    format: w.format,
    price: w.price,
    badge: w.badge,
    fundable: w.fundable,
    desc: w.opis,
    learn: [...w.learn],
    program: w.program.map((m) => ({ n: m.n, t: m.t })),
    forWhom: w.for_whom,
    ...(w.terms ? { terms: [...w.terms] } : {}),
    status: w.status,
    publishedAt: w.published_at,
  };
}

/** Przepisuje model na wiersz bazy; brak klucza terms daje null. */
export function szkolenieNaWiersz(s: SzkoleniePanel): SzkolenieDoZapisu {
  return {
    id: s.id,
    sort_order: s.sortOrder,
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
    program: s.program.map((m) => ({ n: m.n, t: m.t })),
    for_whom: s.forWhom,
    terms: s.terms ? [...s.terms] : null,
    status: s.status,
    published_at: s.publishedAt,
  };
}

/** Przepisuje wiersz trenera na model panelu. */
export function wierszNaTrenera(w: TrenerWiersz): TrenerPanel {
  return {
    id: w.id,
    sortOrder: w.sort_order,
    name: w.name,
    initials: w.initials,
    role: w.role,
    areas: [...w.areas],
    tagline: w.tagline,
    bio: w.bio,
    experience: (w.experience ?? []).map((e) => ({ ...e })),
    education: (w.education ?? []).map((e) => ({ ...e })),
    skills: [...(w.skills ?? [])],
    photoUrl: w.photo_url,
    status: w.status,
    publishedAt: w.published_at,
  };
}

/** Przepisuje model trenera na wiersz bazy. */
export function trenerNaWiersz(t: TrenerPanel): TrenerDoZapisu {
  return {
    id: t.id,
    sort_order: t.sortOrder,
    name: t.name,
    initials: t.initials,
    role: t.role,
    areas: [...t.areas],
    tagline: t.tagline,
    bio: t.bio,
    experience: t.experience.map((e) => ({ ...e })),
    education: t.education.map((e) => ({ ...e })),
    skills: [...t.skills],
    photo_url: t.photoUrl,
    status: t.status,
    published_at: t.publishedAt,
  };
}
