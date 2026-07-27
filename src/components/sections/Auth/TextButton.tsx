"use client";

import { cn } from "@/utils/helpers";

export interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

/**
 * A real button that looks like a link.
 *
 * Every piece of state navigation on the auth screen ("Sign Up", "Sign In",
 * "Forgot password?") was a HeroUI `Link` with an `onClick` and no `href` — an
 * `<a>` with no destination, which browsers do not put in the tab order and do
 * not activate on Enter. `cursor-pointer` had been bolted on precisely because
 * the element wasn't behaving like a link (§5.8). These are state changes, not
 * destinations, so the correct element is a button.
 */
const TextButton: React.FC<TextButtonProps> = ({ className, children, ...props }) => {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "text-primary rounded-sm font-medium underline-offset-4",
        "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
        "hover:underline",
        "focus-visible:ring-primary/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
};

export default TextButton;
