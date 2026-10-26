import { Cpu, Leaf, Languages, CodeXml, FlaskConical } from "lucide-react";
import type { Szkolenie } from "@/lib/szkolenia/adapter";
const ICONS = { cpu: Cpu, leaf: Leaf, languages: Languages, "code-xml": CodeXml, "flask-conical": FlaskConical };

/** Resolves the category icon from the single shared map. */
export function IkonaKategorii({ icon }: { icon: Szkolenie["icon"] }) {
  const Icon = ICONS[icon];
  return <Icon className="size-[22px]" aria-hidden="true" />;
}
