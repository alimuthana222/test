import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "full" | "mark";
  tone?: "brand" | "light" | "dark";
  tagline?: boolean;
}

/**
 * nabda wordmark + heartbeat mark.
 * The mark is a stylised "n" letter whose right stroke turns into a heartbeat
 * pulse, topped with a small circle that stands in for the dot of an "i" —
 * matching the nabda brand identity from the app splash and brand guidelines.
 */
export function NabdaLogo({
  className,
  variant = "full",
  tone = "brand",
  tagline = false,
}: Props) {
  const stroke =
    tone === "light"
      ? "#ffffff"
      : tone === "dark"
        ? "#102A43"
        : "var(--primary)";
  const wordColor =
    tone === "light"
      ? "#ffffff"
      : tone === "dark"
        ? "#102A43"
        : "var(--foreground)";
  const taglineColor =
    tone === "light" ? "rgba(255,255,255,0.85)" : "var(--primary)";

  const Mark = (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={cn("shrink-0", variant === "mark" && className)}
      aria-hidden="true"
    >
      {/* main "n" curve */}
      <path
        d="M12 52 V28 C12 18 20 12 28 12 C34 12 38 15 40 20"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* right leg turning into a heartbeat pulse */}
      <path
        d="M40 20 V36 L44 36 L47 28 L51 44 L55 36 L60 36"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* dot of the "i" */}
      <circle cx="52" cy="14" r="3.5" fill={stroke} />
    </svg>
  );

  if (variant === "mark") return Mark;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="size-10 md:size-12">{Mark}</div>
      <div className="flex flex-col leading-none">
        <span
          className="font-latin text-3xl md:text-[2rem] font-extrabold tracking-tight"
          style={{ color: wordColor }}
        >
          nabda
        </span>
        {tagline && (
          <span
            className="font-latin text-[10px] md:text-xs mt-1 tracking-wide"
            style={{ color: taglineColor }}
          >
            Healthcare begins here
          </span>
        )}
      </div>
    </div>
  );
}