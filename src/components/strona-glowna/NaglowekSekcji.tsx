import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

type Props = {
  id: string;
  eyebrow: string;
  naglowek: string;
  wsparcie?: string;
  wysrodkowany?: boolean;
  className?: string;
};

/** Renders the eyebrow, bold heading and supporting sentence of a section. */
export function NaglowekSekcji({
  id,
  eyebrow,
  naglowek,
  wsparcie,
  wysrodkowany,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        wysrodkowany && "mx-auto max-w-[680px] items-center text-center",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="text-[clamp(2rem,3.4vw,2.6rem)] font-extrabold leading-[1.1] tracking-[var(--ls-tight)]"
      >
        {naglowek}
      </h2>
      {wsparcie && <p className="text-lg text-muted-foreground">{wsparcie}</p>}
    </div>
  );
}
