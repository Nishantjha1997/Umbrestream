import PasswordInput from "@/components/ui/input/PasswordInput";
import { ResetPasswordFormSchema } from "@/schemas/auth";
import type { AuthFieldErrors } from "@/schemas/auth";
import { CAPTCHA_SITE_KEY, isCaptchaEnabled } from "@/utils/captcha";
import { isEmpty } from "@/utils/helpers";
import { LockPassword } from "@/utils/icons";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { useRouter } from "@bprogress/next/app";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import FormAlert from "./FormAlert";

const RESET_FIELDS = ["password", "confirm"] as const;

const getPasswordResetError = (code?: string, status?: number) => {
  if (status === 429 || code === "over_request_rate_limit")
    return "Too many attempts. Wait a minute and try again.";
  if (code === "weak_password")
    return "That password is too easy to guess. Try a longer or less common one.";
  if (code === "same_password") return "Your new password must be different from your current one.";
  if (
    code === "session_expired" ||
    code === "flow_state_expired" ||
    code === "otp_expired" ||
    code === "invalid_token" ||
    code === "session_not_found"
  )
    return "That reset link has expired. Request a new one.";
  return "We couldn't reset your password. Request a new link and try again.";
};

const AuthResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setRecoveryChecked(true);
      return;
    }

    let active = true;

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setHasRecoverySession(Boolean(session?.user));
      setRecoveryChecked(true);
    };

    void checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION" || session) {
        setHasRecoverySession(Boolean(session?.user));
        setRecoveryChecked(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const {
    watch,
    register,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: "onTouched",
    defaultValues: {
      password: "",
      confirm: "",
    },
  });

  const applyFieldErrors = useCallback(
    (fieldErrors?: AuthFieldErrors) => {
      if (!fieldErrors) return;
      for (const field of RESET_FIELDS) {
        const message = fieldErrors[field];
        if (message) setError(field, { type: "server", message });
      }
    },
    [setError],
  );

  const onSubmit = handleSubmit(async (data) => {
    if (!supabase || !hasRecoverySession) {
      setFormError("That reset link is missing or expired. Request a new one to continue.");
      return;
    }

    if (isCaptchaEnabled && isEmpty(data.captchaToken)) {
      setIsVerifying(true);
      return;
    }

    setFormError(null);

    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      const message = getPasswordResetError(error.code, error.status);
      if (error.code === "weak_password" || error.code === "same_password") {
        applyFieldErrors({ password: message });
      }
      setFormError(message);
      setValue("captchaToken", undefined);
      setIsVerifying(false);
      return;
    }

    return router.push("/");
  });

  const onCaptchaSuccess = useCallback(
    (token: string) => {
      setValue("captchaToken", token);
      setIsVerifying(false);
      onSubmit();
    },
    [setValue, setIsVerifying, onSubmit],
  );

  const getButtonText = useCallback(() => {
    if (!recoveryChecked) return "Checking Reset Link...";
    if (!hasRecoverySession) return "Reset Link Required";
    if (isSubmitting) return "Resetting Password...";
    if (isVerifying) return "Verifying...";
    return "Reset Password";
  }, [hasRecoverySession, isSubmitting, isVerifying, recoveryChecked]);

  const isBusy = isSubmitting || isVerifying;

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <p className="text-small text-foreground-500 mb-2 text-center">
        Please enter your new password to continue your streaming journey
      </p>
      {!recoveryChecked && (
        <p className="text-small text-foreground-500 text-center">Checking your secure reset link...</p>
      )}
      {formError && <FormAlert onDismiss={() => setFormError(null)}>{formError}</FormAlert>}
      {recoveryChecked && !hasRecoverySession && !formError && (
        <FormAlert>
          This reset link is no longer active. Request a new link to choose a password.
        </FormAlert>
      )}
      <PasswordInput
        withStrengthMeter
        {...register("password")}
        value={watch("password")}
        isInvalid={!!errors.password?.message}
        errorMessage={errors.password?.message}
        isRequired
        variant="underlined"
        label="New Password"
        placeholder="Enter your new password"
        autoComplete="new-password"
        startContent={<LockPassword className="text-xl" />}
        isDisabled={isBusy}
      />
      <PasswordInput
        {...register("confirm")}
        isInvalid={!!errors.confirm?.message}
        errorMessage={errors.confirm?.message}
        isRequired
        variant="underlined"
        label="Confirm Password"
        placeholder="Confirm your new password"
        autoComplete="new-password"
        startContent={<LockPassword className="text-xl" />}
        isDisabled={isBusy}
      />
      {isCaptchaEnabled && isVerifying && (
        <Turnstile
          className="flex h-fit w-full items-center justify-center"
          siteKey={CAPTCHA_SITE_KEY}
          onSuccess={onCaptchaSuccess}
        />
      )}
      <Button
        className="mt-3 w-full"
        color="primary"
        type="submit"
        variant="solid"
        isLoading={isBusy}
        isDisabled={isBusy || !recoveryChecked || !hasRecoverySession}
      >
        {getButtonText()}
      </Button>
      {recoveryChecked && !hasRecoverySession && (
        <Link className="text-center text-small text-primary" href="/auth?form=forgot">
          Request a new reset link
        </Link>
      )}
    </form>
  );
};

export default AuthResetPasswordForm;
