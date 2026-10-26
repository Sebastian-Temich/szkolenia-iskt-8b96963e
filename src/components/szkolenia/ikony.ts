import { CodeXml, Cpu, FlaskConical, Languages, Leaf, type LucideIcon } from "lucide-react";
import type { Szkolenie } from "@/lib/szkolenia/adapter";

/** Jedyne mapowanie identyfikatora ikony obszaru na komponent lucide-react. */
export const IKONY_SZKOLEN: Record<Szkolenie["icon"], LucideIcon> = {
  cpu: Cpu,
  leaf: Leaf,
  languages: Languages,
  "code-xml": CodeXml,
  "flask-conical": FlaskConical,
};
