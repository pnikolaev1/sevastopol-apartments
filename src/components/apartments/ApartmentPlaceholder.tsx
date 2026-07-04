import { Waves } from "lucide-react";

/**
 * Branded stand-in shown wherever a real apartment photo is not yet available.
 * Uses the Mediterranean tokens so it reads as an intentional design element
 * (and adapts to dark mode) rather than a broken/empty image.
 */
export function ApartmentPlaceholder({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15 ${className}`}
    >
      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 text-primary opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-2 text-primary/70">
        <Waves className="h-10 w-10" aria-hidden />
        {label ? (
          <span className="text-xs font-medium tracking-wide">{label}</span>
        ) : null}
      </div>
      {/* Wave along the bottom edge */}
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-6 w-full text-primary/15"
        aria-hidden
      >
        <path
          d="M0 30 C80 60 160 0 240 30 C320 60 400 10 400 30 L400 60 L0 60 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
