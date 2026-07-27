import { signIn } from "@/actions/auth";
import PasswordInput from "@/components/ui/input/PasswordInput";
import { LoginFormSchema } from "@/schemas/auth";
import type { AuthFieldErrors } from "@/schemas/auth";
import { isEmpty } from "@/utils/helpers";
import { LockPassword, Mail } from "@/utils/icons";
import { Button, Input } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthFormProps } from "./Forms";
import { useRouter } from "@bprogress/next/app";
import { useSearchParams } from "next/navigation";
import { CAPTCHA_SITE_KEY, isCaptchaEnabled } from "@/utils/captcha";
import FormAlert from "./FormAlert";
import TextButton from "./TextButton";

/** Login-form fields a server error can be attributed to. */
const LOGIN_FIELDS = ["email", "loginPassword"] as const;

/**
 * `?next=` is honored here so a user bounced off a protected route lands where
 * they were going rather than on the home page (§5.9).
 *
 * Only same-origin, non-protocol-relative paths are accepted: `//evil.com` is a
 * valid `Location` value that browsers read as an absolute URL, so a bare
 * "starts with /" check would be an open redirect.
 */
const safeNextPath = (next: string | null): string => {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
};

const AuthLoginForm: React.FC<AuthFormProps> = ({ setForm }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginFormSchema),
    // "onChange" fired "Password must be at least 8 characters" on the first
    // keystroke, so the form scolded people mid-typing (§5.8).
    mode: "onTouched",
    defaultValues: {
      email: "",
      loginPassword: "",
    },
  });

  /** Push server-side field errors under the inputs they belong to (§5.3). */
  const applyFieldErrors = useCallback(
    (fieldErrors?: AuthFieldErrors) => {
      if (!fieldErrors) return;
      for (const field of LOGIN_FIELDS) {
        const message = fieldErrors[field];
        if (message) setError(field, { type: "server", message });
      }
    },
    [setError],
  );

  const onSubmit = handleSubmit(async (data) => {
    // Only gate on a captcha token when Turnstile is actually configured.
    // Otherwise the token never arrives and the form deadlocks on "Verifying...".
    if (isCaptchaEnabled && isEmpty(data.captchaToken)) {
      setIsVerifying(true);
      return;
    }

    setFormError(null);

    const { success, message, fieldErrors } = await signIn(data);

    if (!success) {
      applyFieldErrors(fieldErrors);
      setFormError(message ?? "Something went wrong. Please try again.");
      setValue("captchaToken", undefined);
      setIsVerifying(false);
      return;
    }

    return router.push(safeNextPath(searchParams.get("next")));
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
    if (isSubmitting) return "Signing In...";
    if (isVerifying) return "Verifying...";
    return "Sign In";
  }, [isSubmitting, isVerifying]);

  const isBusy = isSubmitting || isVerifying;

  return (
    <div className="flex flex-col gap-5">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <p className="text-small text-foreground-500 mb-2 text-center">
          Sign in to continue your streaming journey
        </p>
        {formError && <FormAlert onDismiss={() => setFormError(null)}>{formError}</FormAlert>}
        <Input
          {...register("email")}
          isInvalid={!!errors.email?.message}
          errorMessage={errors.email?.message}
          isRequired
          label="Email Address"
          placeholder="Enter your email"
          type="email"
          autoComplete="email"
          variant="underlined"
          startContent={<Mail className="text-xl" />}
          isDisabled={isBusy}
        />
        <PasswordInput
          {...register("loginPassword")}
          isInvalid={!!errors.loginPassword?.message}
          errorMessage={errors.loginPassword?.message}
          isRequired
          variant="underlined"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          startContent={<LockPassword className="text-xl" />}
          isDisabled={isBusy}
        />
        <div className="flex w-full items-center justify-end px-1 py-2">
          <TextButton
            className="text-foreground text-small"
            onClick={() => setForm("forgot")}
            disabled={isBusy}
          >
            Forgot password?
          </TextButton>
        </div>
        {isCaptchaEnabled && isVerifying && (
          <Turnstile
            className="flex h-fit w-full items-center justify-center"
            siteKey={CAPTCHA_SITE_KEY}
            onSuccess={onCaptchaSuccess}
          />
        )}
        <Button className="mt-4" color="primary" type="submit" variant="solid" isLoading={isBusy}>
          {getButtonText()}
        </Button>
      </form>
      {/*
        The "OR / Continue with Google" block is gone. `GoogleLoginButton` fired
        a "temporarily unavailable" toast and returned — the real
        `signInWithOAuth` call was commented out — while rendering as a fully
        enabled primary alternative. A control that looks available and does
        nothing is worse than no control (§5.6). Restore it by re-adding the
        button alongside a working OAuth provider, not before.
      */}
      <p className="text-small text-center">
        Don't have an account?{" "}
        <TextButton onClick={() => setForm("register")} disabled={isBusy}>
          Sign Up
        </TextButton>
      </p>
    </div>
  );
};

export default AuthLoginForm;
