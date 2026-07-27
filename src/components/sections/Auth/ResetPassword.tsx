import { resetPassword } from "@/actions/auth";
import PasswordInput from "@/components/ui/input/PasswordInput";
import { ResetPasswordFormSchema } from "@/schemas/auth";
import type { AuthFieldErrors } from "@/schemas/auth";
import { CAPTCHA_SITE_KEY, isCaptchaEnabled } from "@/utils/captcha";
import { isEmpty } from "@/utils/helpers";
import { LockPassword } from "@/utils/icons";
import { useRouter } from "@bprogress/next/app";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import FormAlert from "./FormAlert";

const RESET_FIELDS = ["password", "confirm"] as const;

const AuthResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    if (isCaptchaEnabled && isEmpty(data.captchaToken)) {
      setIsVerifying(true);
      return;
    }

    setFormError(null);

    const { success, message, fieldErrors } = await resetPassword(data);

    if (!success) {
      applyFieldErrors(fieldErrors);
      setFormError(message ?? "Something went wrong. Please try again.");
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
    if (isSubmitting) return "Resetting Password...";
    if (isVerifying) return "Verifying...";
    return "Reset Password";
  }, [isSubmitting, isVerifying]);

  const isBusy = isSubmitting || isVerifying;

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <p className="text-small text-foreground-500 mb-2 text-center">
        Please enter your new password to continue your streaming journey
      </p>
      {formError && <FormAlert onDismiss={() => setFormError(null)}>{formError}</FormAlert>}
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
      >
        {getButtonText()}
      </Button>
    </form>
  );
};

export default AuthResetPasswordForm;
