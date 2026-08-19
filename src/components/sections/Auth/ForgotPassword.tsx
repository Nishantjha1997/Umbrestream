import { Mail } from "@/utils/icons";
import { Button, Input } from "@heroui/react";
import { AuthFormProps } from "./Forms";
import { ForgotPasswordFormSchema } from "@/schemas/auth";
import type { AuthFieldErrors } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isEmpty } from "@/utils/helpers";
import { useCallback, useState } from "react";
import { sendResetPasswordEmail } from "@/actions/auth";
import { Turnstile } from "@marsidev/react-turnstile";
import { CAPTCHA_SITE_KEY, isCaptchaEnabled } from "@/utils/captcha";
import CheckEmail from "./CheckEmail";
import FormAlert from "./FormAlert";

const AuthForgotPasswordForm: React.FC<AuthFormProps> = ({ setForm }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** Non-null once the mail is away — swaps the form for the confirmation panel. */
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ForgotPasswordFormSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const applyFieldErrors = useCallback(
    (fieldErrors?: AuthFieldErrors) => {
      if (fieldErrors?.email) setError("email", { type: "server", message: fieldErrors.email });
    },
    [setError],
  );

  const onSubmit = handleSubmit(async (data) => {
    if (isCaptchaEnabled && isEmpty(data.captchaToken)) {
      setIsVerifying(true);
      return;
    }

    setFormError(null);

    const { success, message, fieldErrors } = await sendResetPasswordEmail(data);

    if (!success) {
      applyFieldErrors(fieldErrors);
      setFormError(message ?? "Something went wrong. Please try again.");
      setValue("captchaToken", undefined);
      setIsVerifying(false);
      return;
    }

    // Previously a `timeout: Infinity` toast over the same, still-editable
    // form. Now the form is replaced by a real confirmation state (§5.4).
    setSentTo(data.email);
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
    if (isSubmitting) return "Sending Email...";
    if (isVerifying) return "Verifying...";
    return "Send";
  }, [isSubmitting, isVerifying]);

  const isBusy = isSubmitting || isVerifying;

  if (sentTo) {
    return (
      <CheckEmail
        title="Check your email"
        description="Open the link we sent to choose a new password. It expires shortly, so use it soon."
        email={sentTo}
        onResend={() => sendResetPasswordEmail({ email: sentTo })}
        onwardLabel="Back to sign in"
        onOnward={() => setForm("login")}
      />
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <p className="text-small text-foreground-500 mb-2 text-center">
        You&apos;ll receive an email with a link to reset your password
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
  );
};

export default AuthForgotPasswordForm;
