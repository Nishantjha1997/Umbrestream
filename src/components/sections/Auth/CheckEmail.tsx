"use client";

import { cn } from "@/utils/helpers";
import { Mail } from "@/utils/icons";
import { Button } from "@heroui/react";
import { useState } from "react";
import FormAlert, { FormAlertTone } from "./FormAlert";
import type { AuthActionResult } from "@/schemas/auth";

export interface CheckEmailProps {
  /** Heading for the panel, e.g. "Check your email". */
  title: string;
  /** One sentence explaining what was sent and what to do with it. */
  description: string;
  /** The address the message went to — shown so typos are catchable. */
  email: string;
  /** Re-sends the message. Its result is surfaced inline. */
  onResend: () => Promise<AuthActionResult>;
  /** Label for the terminal action, e.g. "Back to sign in". */
  onwardLabel: string;
  onOnward: () => void;
}

/**
 * The real success state for Register and Forgot Password (§5.4).
 *
 * Both flows used to "succeed" by firing a `timeout: Infinity` toast over a
 * still-filled, still-submittable form — a permanent overlay in the corner and
 * no change to the thing the user was actually looking at. Register in
 * particular was a dead end: no redirect, no state change, nothing to do next.
 *
 * This replaces the form outright, states the address the mail went to, offers
 * a resend, and gives one clear way onward.
 */
const CheckEmail: React.FC<CheckEmailProps> = ({
  title,
  description,
  email,
  onResend,
  onwardLabel,
  onOnward,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: FormAlertTone; message: string } | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setFeedback(null);
    try {
      const result = await onResend();
      setFeedback({
        tone: result.success ? "success" : "danger",
        message: result.message ?? (result.success ? "Sent again." : "Couldn't resend just now."),
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span
        aria-hidden
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          "bg-primary/12 text-primary ring-primary/25 ring-1",
        )}
      >
        <Mail className="text-3xl" />
      </span>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-small text-foreground-500 leading-relaxed">{description}</p>
      </div>

      <p className="bg-foreground/5 border-foreground/10 max-w-full truncate rounded-(--radius-card) border px-3 py-2 text-small font-medium">
        {email}
      </p>

      {feedback && (
        <FormAlert tone={feedback.tone} className="w-full text-left">
          {feedback.message}
        </FormAlert>
      )}

      <div className="flex w-full flex-col gap-2 pt-1">
        <Button variant="flat" onPress={handleResend} isLoading={isResending} className="w-full">
          {isResending ? "Resending..." : "Resend email"}
        </Button>
        <Button variant="light" onPress={onOnward} className="w-full">
          {onwardLabel}
        </Button>
      </div>

      <p className="text-tiny text-foreground-400">
        Nothing after a few minutes? Check your spam folder.
      </p>
    </div>
  );
};

export default CheckEmail;
