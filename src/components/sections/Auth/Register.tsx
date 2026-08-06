import { resendConfirmationEmail, signUp } from "@/actions/auth";
import { LockPassword, Mail, User } from "@/utils/icons";
import { Button, Input } from "@heroui/react";
import { AuthFormProps } from "./Forms";
import { RegisterFormSchema } from "@/schemas/auth";
import type { AuthFieldErrors } from "@/schemas/auth";
import PasswordInput from "@/components/ui/input/PasswordInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useState } from "react";
import { isEmpty } from "@/utils/helpers";
import { CAPTCHA_SITE_KEY, isCaptchaEnabled } from "@/utils/captcha";
import CheckEmail from "./CheckEmail";
import FormAlert from "./FormAlert";
import TextButton from "./TextButton";
import { trackUmbraEvent } from "@/lib/analytics/client";

/** Register-form fields a server error can be attributed to. */
const REGISTER_FIELDS = ["username", "email", "password", "confirm"] as const;

const AuthRegisterForm: React.FC<AuthFormProps> = ({ setForm }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** Non-null once the account exists — swaps the form for the confirmation panel. */
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    watch,
    register,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(RegisterFormSchema),
    // Not "onChange": that flagged "Password must be at least 8 characters" on
    // the first keystroke of an empty field (§5.8).
    mode: "onTouched",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const applyFieldErrors = useCallback(
    (fieldErrors?: AuthFieldErrors) => {
      if (!fieldErrors) return;
      for (const field of REGISTER_FIELDS) {
        const message = fieldErrors[field];
        if (message) setError(field, { type: "server", message });
      }
    },
    [setError],
  );

  const onSubmit = handleSubmit(async (data) => {
    trackUmbraEvent("signup_started", { method: "email" });
    if (isCaptchaEnabled && isEmpty(data.captchaToken)) {
      setIsVerifying(true);
      return;
    }

    setFormError(null);

    const { success, message, fieldErrors } = await signUp(data);

    if (!success) {
      trackUmbraEvent("signup_failed", { method: "email" });
      applyFieldErrors(fieldErrors);
      setFormError(message ?? "Something went wrong. Please try again.");
      setValue("captchaToken", undefined);
      setIsVerifying(false);
      return;
    }

    // Sign-up used to end here with a `timeout: Infinity` toast over a form
    // that was still filled in and still submittable — no redirect, no state
    // change, nothing to do next (§5.4).
    trackUmbraEvent("signup_completed", { method: "email" });
    setRegisteredEmail(data.email);
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
    if (isSubmitting) return "Signing Up...";
    if (isVerifying) return "Verifying...";
    return "Sign Up";
  }, [isSubmitting, isVerifying]);

  const isBusy = isSubmitting || isVerifying;

  if (registeredEmail) {
    return (
      <CheckEmail
        title="Confirm your email"
        description="Your account is created. Open the link we just sent to finish setting it up and sign in."
        email={registeredEmail}
        onResend={() => resendConfirmationEmail({ email: registeredEmail })}
        onwardLabel="Back to sign in"
        onOnward={() => setForm("login")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <p className="text-small text-foreground-500 mb-2 text-center">
          Join to track your favorites and watch history
        </p>
        {formError && <FormAlert onDismiss={() => setFormError(null)}>{formError}</FormAlert>}
        <Input
          {...register("username")}
          isInvalid={!!errors.username?.message}
          errorMessage={errors.username?.message}
          isRequired
          label="Username"
          placeholder="Enter your username"
          autoComplete="username"
          variant="underlined"
          startContent={<User className="text-xl" />}
          isDisabled={isBusy}
        />
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
        {/* `withStrengthMeter` existed but nothing passed it, so the whole
            requirement checklist was dead code (§5.6). This is the one field
            where it earns its place: a password being chosen, not recalled. */}
        <PasswordInput
          withStrengthMeter
          value={watch("password")}
          {...register("password")}
          isInvalid={!!errors.password?.message}
          errorMessage={errors.password?.message}
          isRequired
          variant="underlined"
          label="Password"
          placeholder="Enter your password"
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
          placeholder="Confirm your password"
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
        >
          {getButtonText()}
        </Button>
      </form>
      {/* Google sign-in removed here for the same reason as on the login form:
          it was a stub that only ever announced its own unavailability (§5.6). */}
      <p className="text-small text-center">
        Already have an account?{" "}
        <TextButton onClick={() => setForm("login")} disabled={isBusy}>
          Sign In
        </TextButton>
      </p>
    </div>
  );
};

export default AuthRegisterForm;
