"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

/**
 * The quiet empty state used by the personal home sections.
 *
 * Continue Watching and Recommended both used to `return null` when they had
 * nothing to show, so a signed-out first-time visitor landed on a tab bar and
 * a stack of TMDB rows with no indication that the app has a memory at all
 * (§6). Returning null is also indistinguishable from "still loading" for
 * anyone watching the page settle.
 *
 * Deliberately not a marketing panel: one heading, one line of copy, at most
 * one action, on the same `glass-panel` tier as the shelf's failure notice so
 * the two read as the same family rather than two different products.
 */

export interface HomeEmptyStateProps {
  /** The section heading, matching the type treatment <Shelf> uses. */
  title: string;
  /** One short line saying what would be here. */
  headline: string;
  /** One short line saying how to make it appear. */
  description: string;
  action?: { label: string; href: string };
}

const HomeEmptyState: React.FC<HomeEmptyStateProps> = ({
  title,
  headline,
  description,
  action,
}) => (
  <div className="flex w-full flex-col gap-3">
    <div className="flex h-7 items-center md:h-8">
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h2>
    </div>
    <div className="glass-panel flex flex-col items-start gap-3 rounded-(--radius-panel) border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{headline}</p>
        <p className="text-default-500 text-xs">{description}</p>
      </div>
      {action && (
        <Button
          as={Link}
          href={action.href}
          size="sm"
          variant="flat"
          radius="full"
          className="shrink-0"
        >
          {action.label}
        </Button>
      )}
    </div>
  </div>
);

export default HomeEmptyState;
