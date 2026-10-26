import type { Szkolenie } from "@/lib/szkolenia/adapter";
import { IKONY_SZKOLEN } from "./ikony";

/** Rozwiązuje ikonę kategorii ze wspólnego mapowania. */
export function IkonaKategorii({ icon }: { icon: Szkolenie["icon"] }) {
  const Icon = IKONY_SZKOLEN[icon];
  return <Icon className="size-[22px]" aria-hidden="true" />;
}
