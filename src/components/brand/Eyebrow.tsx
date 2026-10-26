import { cn } from "@/lib/utils";

/** Renders the small uppercase section label preceded by a dash. */
export function Eyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[var(--ls-caps)] text-[var(--green-600)]",
        className,
      )}
    >
      <span className="h-0.5 w-[22px] rounded-sm bg-current" aria-hidden="true" />
      {children}
    </p>
  );
}
