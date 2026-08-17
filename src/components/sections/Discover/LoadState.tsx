"use client";

import { Button } from "@heroui/react";

interface DiscoverLoadStateProps {
  title: string;
  description: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function DiscoverLoadState({
  title,
  description,
  onRetry,
  isRetrying = false,
}: DiscoverLoadStateProps) {
  return (
    <div
      role="alert"
      className="glass-panel flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-(--radius-panel) border px-6 py-10 text-center"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-default-500 max-w-md text-sm">{description}</p>
      <Button size="sm" radius="full" variant="flat" onPress={onRetry} isLoading={isRetrying}>
        Try again
      </Button>
    </div>
  );
}
