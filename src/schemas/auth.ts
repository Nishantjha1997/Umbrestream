import * as z from "zod";

/**
 * A captcha token is machine-generated. If it is the wrong length the widget
 * misbehaved — the user did nothing wrong and cannot act on "Token too short",
 * which is internal language that must never surface (§5.3). Both bounds share
 * one piece of human copy.
 */
const CAPTCHA_MESSAGE = "Captcha verification failed. Please try again.";

const AuthFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    // The message used to say 20 while the rule said 25, so a 22-character
    // username was rejected by a message claiming it was fine.
    .max(25, "Username must not exceed 25 characters"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  // Login deliberately does not restate the strength rules — the account's
  // password already exists and telling someone their *stored* password is too
  // short is nonsense. It only needs to be non-empty.
  loginPassword: z.string().min(1, "Password is required"),
  confirm: z.string().min(1, "Password confirmation is required"),
  captchaToken: z.string().min(500, CAPTCHA_MESSAGE).max(5000, CAPTCHA_MESSAGE).optional(),
});

const RegisterFormSchema = AuthFormSchema.omit({ loginPassword: true }).refine(
  (data) => data.password === data.confirm,
  {
    message: "Passwords do not match",
    path: ["confirm"],
  },
);

const LoginFormSchema = AuthFormSchema.pick({
  email: true,
  loginPassword: true,
  captchaToken: true,
});

const ForgotPasswordFormSchema = AuthFormSchema.pick({ email: true, captchaToken: true });

const ResendEmailFormSchema = AuthFormSchema.pick({ email: true });

const ResetPasswordFormSchema = AuthFormSchema.pick({
  password: true,
  confirm: true,
  captchaToken: true,
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type AuthFormInput = z.infer<typeof AuthFormSchema>;
type RegisterFormInput = z.infer<typeof RegisterFormSchema>;
type LoginFormInput = z.infer<typeof LoginFormSchema>;
type ForgotPasswordFormInput = z.infer<typeof ForgotPasswordFormSchema>;
type ResendEmailFormInput = z.infer<typeof ResendEmailFormSchema>;
type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;

/** Every field name an auth form can attribute an error to. */
type AuthFieldName = keyof AuthFormInput;

/** Server-side errors that belong under a specific input rather than in a banner. */
type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;

/**
 * What every auth server action returns.
 *
 * `message` is form-level copy for the inline banner and is **always** written
 * for humans — provider strings never pass through it. `fieldErrors` carries
 * anything attributable to a single input so the form can render it under that
 * input instead of in a toast.
 */
interface AuthActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: AuthFieldErrors;
}

export {
  AuthFormSchema,
  RegisterFormSchema,
  LoginFormSchema,
  ForgotPasswordFormSchema,
  ResendEmailFormSchema,
  ResetPasswordFormSchema,
};

export type {
  AuthActionResult,
  AuthFieldErrors,
  AuthFieldName,
  AuthFormInput,
  RegisterFormInput,
  LoginFormInput,
  ForgotPasswordFormInput,
  ResendEmailFormInput,
  ResetPasswordFormInput,
};
