"use client";

import { Button } from "@heroui/react";

interface InlineRetryProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

export default function InlineRetry({
  message = "Couldn't load — please try again",
  onRetry,
  isRetrying = false,
  className = "",
}: InlineRetryProps) {
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/70 ${className}`}
    >
      <span className="truncate">{message}</span>
      <Button
        size="sm"
        variant="flat"
        color="primary"
        radius="full"
        isLoading={isRetrying}
        onPress={onRetry}
        className="flex-none font-medium"
      >
        Try again
      </Button>
    </div>
  );
}
