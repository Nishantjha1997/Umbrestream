"use client";

import { Button, Link } from "@heroui/react";
import React from "react";
import { cn } from "@/utils/helpers";
import { List } from "@/utils/icons";

interface UnauthorizedNoticeProps {
  title: string;
  description: string;
}

/**
 * Signed-out state for gated pages (currently `/library`).
 *
 * This used to be four bare elements floating in the middle of an empty
 * viewport, which reads as an error rather than as a place you have not filled
 * yet. It is now a single `glass-panel` card: one glyph, one line of copy, one
 * primary action. The panel gives the message somewhere to live without adding
 * a second competing surface — chrome recedes, but nothing should look broken
 * (§1.1.1).
 */
const UnauthorizedNotice: React.FC<UnauthorizedNoticeProps> = ({ title, description }) => {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4">
      <section
        aria-labelledby="unauthorized-notice-title"
        className={cn(
          "glass-panel shelf-reveal w-full max-w-md rounded-(--radius-panel) border",
          "flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-10",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-full bg-foreground/5 text-default-500 ring-1 ring-foreground/10"
        >
          <List className="size-5" />
        </span>

        <div className="flex flex-col gap-1.5">
          <h2
            id="unauthorized-notice-title"
            className="text-xl font-semibold tracking-tight text-balance"
          >
            {title}
          </h2>
          <p className="text-sm text-default-500 text-balance">{description}</p>
        </div>

        <div className="mt-1 flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
          <Button
            fullWidth
            as={Link}
            href="/auth"
            color="primary"
            className="font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-auto sm:px-8"
          >
            Sign In
          </Button>
          <Button
            fullWidth
            as={Link}
            href="/auth?form=register"
            variant="light"
            className="font-medium text-default-500 transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none sm:w-auto"
          >
            Create account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default UnauthorizedNotice;
