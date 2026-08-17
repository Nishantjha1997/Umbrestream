"use client";

import { Button } from "@heroui/react";

interface ServiceRetryStateProps {
  title: string;
  description: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function ServiceRetryState({
  title,
  description,
  onRetry,
  isRetrying = false,
}: ServiceRetryStateProps) {
  return (
    <div
      role="alert"
      className="absolute-center flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-default-500 text-sm">{description}</p>
      <Button color="primary" radius="full" isLoading={isRetrying} onPress={onRetry}>
        Try again
      </Button>
    </div>
  );
}
