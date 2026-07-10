import { Waves } from "lucide-react";

/**
 * Branded stand-in shown wherever a real apartment photo is not yet available.
 * Diagonal-stripe treatment from the Navy & Gold design handoff — reads as an
 * intentional design element (and adapts to dark mode) rather than a broken
 * or empty image.
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
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[repeating-linear-gradient(45deg,#E4E0D6_0_12px,#EEEAE1_12px_24px)] dark:bg-[repeating-linear-gradient(45deg,#1B3350_0_14px,#22405F_14px_28px)] ${className}`}
    >
      <div className="relative flex flex-col items-center gap-2 text-gold-deep/50 dark:text-gold/50">
        <Waves className="h-10 w-10" aria-hidden />
        {label ? (
          <span className="text-xs font-medium tracking-wide">{label}</span>
        ) : null}
      </div>
    </div>
  );
}
