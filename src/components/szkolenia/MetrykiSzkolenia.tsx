import { Clock, Monitor, Gauge } from "lucide-react";
import type { Szkolenie } from "@/lib/szkolenia/adapter";

/** Displays duration, delivery format and level in a shared order. */
export function MetrykiSzkolenia({
  szkolenie,
  detail = false,
}: {
  szkolenie: Szkolenie;
  detail?: boolean;
}) {
  const metrics = [
    { label: "Czas trwania", value: szkolenie.hours, Icon: Clock },
    { label: "Format", value: szkolenie.format, Icon: Monitor },
    { label: "Poziom", value: szkolenie.level, Icon: Gauge },
  ];
  return (
    <dl
      className={
        detail
          ? "grid gap-5 sm:grid-cols-3"
          : "flex flex-wrap gap-3 text-[12.5px] text-muted-foreground"
      }
    >
      {metrics.map(({ label, value, Icon }) => (
        <div key={label} className={detail ? "space-y-2" : "flex items-center gap-1.5"}>
          <dt
            className={
              detail
                ? "flex items-center gap-2 text-[13px] text-[var(--text-secondary)]"
                : "flex items-center"
            }
          >
            <Icon className="size-[15px] shrink-0" aria-hidden="true" />
            <span className={detail ? "" : "sr-only"}>{label}</span>
          </dt>
          <dd className={detail ? "pl-[22px] text-[15.5px] font-semibold" : ""}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
