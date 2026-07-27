"use client";

import { cn } from "@/utils/helpers";
import { Check, Close, Warning } from "@/utils/icons";
import { Button } from "@heroui/react";

export type FormAlertTone = "danger" | "success";

export interface FormAlertProps {
  tone?: FormAlertTone;
  children: React.ReactNode;
  /** Renders a dismiss button when provided. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline, in-flow feedback for an auth form.
 *
 * Server errors used to arrive as top-right toasts with `maxVisibleToasts={1}`,
 * so the explanation for a failed submit appeared in the opposite corner of the
 * screen from the button that failed — and a second error silently replaced the
 * first (§5.3). This sits directly above the form it describes and stays until
 * the next submit.
 *
 * `role="alert"` (assertive) for failures so screen readers announce them
 * immediately; `role="status"` (polite) for confirmations, which shouldn't
 * interrupt.
 */
const FormAlert: React.FC<FormAlertProps> = ({ tone = "danger", children, onDismiss, className }) => {
  const isDanger = tone === "danger";

  return (
    <div
      role={isDanger ? "alert" : "status"}
      aria-live={isDanger ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2.5 rounded-(--radius-card) border px-3 py-2.5 text-small",
        "motion-safe:motion-preset-fade",
        isDanger
          ? "border-danger/25 bg-danger/10 text-danger-600 dark:text-danger-400"
          : "border-success/25 bg-success/10 text-success-600 dark:text-success-400",
        className,
      )}
    >
      <span aria-hidden className="mt-0.5 shrink-0">
        {isDanger ? <Warning className="text-sm" /> : <Check className="text-sm" />}
      </span>
      <p className="flex-1 leading-snug">{children}</p>
      {onDismiss && (
        <Button
          isIconOnly
          size="sm"
          radius="full"
          variant="light"
          aria-label="Dismiss message"
          onPress={onDismiss}
          className="-mt-1 -mr-1 h-6 min-h-6 w-6 min-w-6 shrink-0 text-current"
        >
          <Close className="text-lg" />
        </Button>
      )}
    </div>
  );
};

export default FormAlert;
