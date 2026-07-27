import { colors, ColorType } from "@/types/component";
import { cn } from "@/utils/helpers";
import { tv } from "tailwind-variants";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Accent hue for the optional indicator bar.
   *
   * @deprecated Colour is not taxonomy (§1.1.3) — `primary`/`warning`/`secondary`
   * used to mean movie/TV/anime, which Apple TV+ does not do and which breaks the
   * moment a fourth media type appears. Retained so existing call sites keep
   * compiling, but it is inert unless you also opt into `indicator`.
   *
   * @default "primary"
   */
  color?: ColorType;
  /**
   * Typographic scale. This is **presentation only** — it no longer decides
   * which element is rendered. Use {@link SectionTitleProps.as} for that.
   *
   * @default "h5"
   */
  size?: HeadingLevel;
  /**
   * The heading element to render.
   *
   * Previously this component emitted `<h1>` unconditionally, so a home page
   * with six shelves shipped six `h1`s and a document outline that told a
   * screen-reader user nothing (§11.6). Section headers sit under the page
   * title, so `h2` is the right default; override only when the surrounding
   * outline genuinely calls for a deeper level.
   *
   * @default "h2"
   */
  as?: HeadingLevel;
  /**
   * Render the coloured accent bar to the left of the title.
   *
   * Off by default. A rounded accent rect beside every heading is a
   * dashboard/admin-template motif; Apple TV+ shelf headers are plain type
   * (§1.1.1 — chrome recedes).
   *
   * @default false
   */
  indicator?: boolean;
  classNames?: {
    container?: string;
    indicator?: string;
    title?: string;
  };
}

const title = tv({
  // Semibold, not bold: with the global `font-black` heading block gone (§1.4),
  // section headers carry hierarchy through size and tracking rather than mass.
  base: "font-semibold tracking-tight",
  variants: {
    size: {
      h1: "text-4xl md:text-5xl",
      h2: "text-3xl md:text-4xl",
      h3: "text-2xl md:text-3xl",
      h4: "text-xl md:text-2xl",
      h5: "text-lg md:text-xl",
      h6: "text-base md:text-lg",
    },
  },
  defaultVariants: {
    size: "h5",
  },
});

const indicatorStyles = tv({
  base: "shrink-0 rounded-full",
  variants: {
    size: {
      h1: "h-16 w-3",
      h2: "h-14 w-3",
      h3: "h-12 w-2.5",
      h4: "h-10 w-2.5",
      h5: "h-8 w-2",
      h6: "h-6 w-2",
    },
  },
  defaultVariants: {
    size: "h5",
  },
});

/**
 * Heading for a shelf, section, or detail-page block.
 *
 * The public API is intentionally unchanged in shape — `color`, `size`,
 * `className` and `classNames.{container,indicator,title}` all still typecheck
 * and still land where they used to — because call sites across the movie, TV
 * and anime trees pass them.
 */
const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  color = "primary",
  size,
  as: Heading = "h2",
  indicator = false,
  className,
  classNames,
  ...props
}) => {
  return (
    <div className={cn("flex items-center gap-2", classNames?.container, className)} {...props}>
      {indicator && (
        <div
          aria-hidden="true"
          className={cn(indicatorStyles({ size }), colors({ color }), classNames?.indicator)}
        />
      )}
      <Heading className={cn(title({ size }), classNames?.title)}>{children}</Heading>
    </div>
  );
};

export default SectionTitle;
