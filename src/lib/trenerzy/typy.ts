import type { KategoriaSzkolenia } from "@/lib/szkolenia/typy";

export type DoswiadczenieTrenera = { period: string; title: string; org: string; desc: string };
export type WyksztalcenieTrenera = { title: string; org: string };

/**
 * Trener w widoku publicznym. `photoUrl` jest opcjonalnym adresem — w tym etapie nie ma
 * uploadu plików ani bucketu Storage, a makieta pokazuje inicjały (kontrakt E02/B §1.2).
 */
export type Trener = {
  id: string;
  name: string;
  initials: string;
  role: string;
  areas: KategoriaSzkolenia[];
  tagline: string;
  bio: string;
  experience: DoswiadczenieTrenera[];
  education: WyksztalcenieTrenera[];
  skills: string[];
  photoUrl: string | null;
};
