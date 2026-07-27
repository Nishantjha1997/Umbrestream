import { cn, formatNumber } from "@/utils/helpers";
import { Star } from "@/utils/icons";
import { tv } from "tailwind-variants";

export interface RatingProps {
  /** The score itself, on a 0–{@link RatingProps.max} scale. */
  rate: number;
  /** Number of votes behind the score. Hidden when `0`. */
  count?: number;
  /**
   * Type scale. `md` is the historical rendering — it sets no font size at all
   * and inherits from the parent, which is what every existing call site
   * expects.
   *
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * `accent` is the amber-on-semibold treatment this component has always had.
   * `plain` inherits colour and weight from its parent, for surfaces that want
   * the rating to sit quietly next to other metadata (§1.1.5) instead of
   * shouting one saturated hue from inside a card.
   *
   * @default "accent"
   */
  variant?: "accent" | "plain";
  /** Top of the scale. Only used to phrase the accessible label. @default 10 */
  max?: number;
  className?: string;
  /**
   * Overrides the generated label. The default reads
   * `Rated 8.2 out of 10 from 1.2K ratings`.
   */
  "aria-label"?: string;
}

const rating = tv({
  base: "flex items-center gap-1",
  variants: {
    size: {
      sm: "gap-0.5 text-xs",
      // Deliberately empty: the pre-existing default set no size and inherited.
      md: "",
      lg: "gap-1.5 text-base",
    },
    variant: {
      accent: "font-semibold text-warning-500",
      plain: "",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "accent",
  },
});

/**
 * Star + score, used on cards, hover previews and detail overviews.
 *
 * Every addition here is optional and the defaults reproduce the previous
 * markup byte-for-byte in class terms, because this component is imported
 * directly by call sites owned by other parts of the overhaul (§11.7).
 *
 * The container is `role="img"` with a single label: a screen reader
 * announcing "star 8.2 1.2 K" is noise, and the visible glyph/number pair is
 * one idea, not three.
 */
const Rating: React.FC<RatingProps> = ({
  rate = 0,
  count = 0,
  size,
  variant,
  max = 10,
  className,
  "aria-label": ariaLabel,
}) => {
  const score = rate.toFixed(1);
  const label =
    ariaLabel ??
    `Rated ${score} out of ${max}${count > 0 ? ` from ${formatNumber(count)} ratings` : ""}`;

  return (
    <div role="img" aria-label={label} className={cn(rating({ size, variant }), className)}>
      <Star aria-hidden="true" />
      <p>
        {score} {count > 0 && `(${formatNumber(count)})`}
      </p>
    </div>
  );
};

export default Rating;
