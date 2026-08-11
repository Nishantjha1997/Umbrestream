"use server";

import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import {
  ForgotPasswordFormSchema,
  LoginFormSchema,
  RegisterFormSchema,
  ResendEmailFormSchema,
  ResetPasswordFormSchema,
} from "@/schemas/auth";
import type {
  AuthActionResult,
  AuthFieldErrors,
  AuthFieldName,
  ForgotPasswordFormInput,
  LoginFormInput,
  RegisterFormInput,
  ResendEmailFormInput,
  ResetPasswordFormInput,
} from "@/schemas/auth";
import { z } from "zod";
import type { ActionResponse } from "@/types";
import { isCaptchaEnabled } from "@/utils/captcha";
import { env } from "@/utils/env";
import { SITE_URL } from "@/config/brand";

/**
 * A generic type for our authentication actions.
 * @template T The type of the form data.
 * @param data The validated form data.
 * @param supabase The Supabase client instance.
 * @returns An AuthActionResult.
 */
type AuthAction<T> = (data: T, supabase: SupabaseClient) => Promise<AuthActionResult>;

/** The one string a user sees when we have nothing specific and safe to say. */
const GENERIC_ERROR = "Something went wrong on our end. Please try again.";

type SupabaseErrorLike = { code?: string; status?: number; message?: string } | null | undefined;

/**
 * Supabase error code → human copy, plus the field it belongs under.
 *
 * **Nothing from `error.message` ever reaches the client** (§5.3). Provider
 * strings are written for developers ("Invalid login credentials",
 * "Email not confirmed", "AuthApiError: ..."), they change without notice, and
 * some of them embed data we should not echo back. Anything not in this table
 * degrades to `GENERIC_ERROR` and is logged server-side instead.
 */
const AUTH_ERROR_COPY: Record<string, { message: string; field?: AuthFieldName }> = {
  invalid_credentials: {
    message: "That email and password don't match an account.",
  },
  email_not_confirmed: {
    message: "Confirm your email address first — check your inbox for the link we sent.",
  },
  email_address_invalid: {
    message: "Enter a valid email address.",
    field: "email",
  },
  email_address_not_authorized: {
    message: "We can't send email to that address.",
    field: "email",
  },
  email_exists: {
    message: "An account with that email already exists.",
    field: "email",
  },
  user_already_exists: {
    message: "An account with that email already exists.",
    field: "email",
  },
  weak_password: {
    message: "That password is too easy to guess. Try a longer or less common one.",
    field: "password",
  },
  same_password: {
    message: "Your new password must be different from your current one.",
    field: "password",
  },
  captcha_failed: {
    message: "Captcha verification failed. Please try again.",
  },
  over_request_rate_limit: {
    message: "Too many attempts. Wait a minute and try again.",
  },
  over_email_send_rate_limit: {
    message: "We've sent a few emails already. Wait a minute before requesting another.",
  },
  signup_disabled: {
    message: "New sign-ups are closed right now.",
  },
  email_provider_disabled: {
    message: "Email sign-in is unavailable right now.",
  },
  session_expired: {
    message: "That link has expired. Request a new one.",
  },
  flow_state_expired: {
    message: "That link has expired. Request a new one.",
  },
  otp_expired: {
    message: "That link has expired. Request a new one.",
  },
  user_not_found: {
    message: "We couldn't find an account for that email.",
    field: "email",
  },
  validation_failed: {
    message: "Please check the details you entered and try again.",
  },
};

/**
 * Translate a Supabase error into something a user can act on.
 *
 * @param context Where it happened — logged, never returned.
 */
const toAuthFailure = (context: string, error: SupabaseErrorLike): AuthActionResult => {
  // The raw error is useful to us and to nobody else, so it stays in the logs.
  console.error(`[auth] ${context}:`, error);

  const known = error?.code ? AUTH_ERROR_COPY[error.code] : undefined;

  if (!known) {
    // Rate limiting has a status code even when the body has no `code`.
    if (error?.status === 429)
      return { success: false, message: AUTH_ERROR_COPY.over_request_rate_limit.message };
    return { success: false, message: GENERIC_ERROR };
  }

  return {
    success: false,
    message: known.message,
    fieldErrors: known.field ? { [known.field]: known.message } : undefined,
  };
};

/**
 * A higher-order function to create a server action that handles
 * form validation, captcha checks, and Supabase client creation.
 * @template T The type of the form data, which must include an optional captchaToken.
 * @param schema The Zod schema for validation.
 * @param action The core logic of the server action.
 * @returns An async function that serves as the server action.
 */
const createAuthAction = <T extends { captchaToken?: string }>(
  schema: z.ZodSchema<T>,
  action: AuthAction<T>,
  admin?: boolean,
) => {
  return async (formData: T): Promise<AuthActionResult> => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      // Previously every issue was joined with ". " into one run-on banner, so
      // a form with three bad fields produced one unreadable sentence pinned
      // nowhere near the inputs. Attribute each issue to its field instead and
      // keep only a short summary for the banner (§5.3).
      const fieldErrors: AuthFieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field !== "string") continue;
        const key = field as AuthFieldName;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }

      const attributed = Object.keys(fieldErrors).length;
      return {
        success: false,
        message: attributed ? "Please fix the highlighted fields." : GENERIC_ERROR,
        fieldErrors: attributed ? fieldErrors : undefined,
      };
    }

    // Only require a token when Turnstile is actually configured. Requiring it
    // unconditionally made sign-in impossible without a site key, because the
    // client can never produce a token it has no widget to generate.
    if (isCaptchaEnabled && !result.data.captchaToken) {
      return { success: false, message: "Please complete the captcha and try again." };
    }

    try {
      const supabase = await createClient(admin);
      return await action(result.data, supabase);
    } catch (error) {
      // An unhandled throw here is a bug or an outage. Either way `error.message`
      // is a stack-adjacent developer string; log it and show generic copy.
      console.error("[auth] Unhandled error in auth action:", error);
      return { success: false, message: GENERIC_ERROR };
    }
  };
};

const signInWithEmailAction: AuthAction<LoginFormInput> = async (data, supabase) => {
  const { data: user, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.loginPassword,
    options: {
      captchaToken: data.captchaToken,
    },
  });

  if (error) return toAuthFailure("signInWithPassword failed", error);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.user.id)
    .maybeSingle();

  if (!profile) {
    // Authentication *succeeded* — the session cookie is already set. A missing
    // or unreadable profile row is our problem, not a login failure, and the
    // old copy ("Database error. Could not get username for <email>.") both
    // lied about what happened and echoed the user's address back at them.
    // Log it and greet them generically. (The underlying orphaned-profile bug
    // is §5.7 and needs a DB-level fix.)
    console.error("[auth] Signed-in user has no profile row:", profileError ?? "no rows returned");
    return { success: true, message: "Welcome back" };
  }

  return { success: true, message: `Welcome back, ${profile.username}` };
};

/**
 * Sign-up used to run end-to-end on the **service-role** key
 * (`createAuthAction(..., true)`), which meant an unauthenticated, internet-facing
 * endpoint executed every statement with RLS switched off and full database
 * authority. Nothing in the old code exploited that, but it removed the safety net
 * entirely: the blast radius of any future edit, or of a bug in argument handling,
 * went from "one RLS denial" to "arbitrary read/write across every table". It also
 * routed `auth.signUp` itself through an admin credential, which is not where you
 * want captcha and per-IP signup throttling to be decided.
 *
 * Now: everything runs on the anon key under the caller's own session, and the
 * service role is borrowed for exactly one statement — the `profiles` insert —
 * because a user who has not yet confirmed their email has no session, so the
 * `auth.uid() = id` insert policy cannot pass.
 *
 * The real fix is to delete that borrow too, by creating the profile row in a
 * `security definer` trigger on `auth.users`. See
 * supabase/migrations/*_profiles_autocreate.sql — once that trigger is applied,
 * this whole block and the `admin` parameter on `createClient` can go.
 */
const signUpAction: AuthAction<RegisterFormInput> = async (data, supabase) => {
  // Check username availability. `profiles` has a public SELECT policy, so the
  // anon key is sufficient here.
  const { data: usernameExists, error: usernameError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", data.username)
    .maybeSingle();

  if (usernameError) {
    console.error("[auth] Username availability check failed:", usernameError);
    return { success: false, message: GENERIC_ERROR };
  }

  if (usernameExists) {
    const message = "That username is already taken.";
    return { success: false, message, fieldErrors: { username: message } };
  }

  // Create user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      captchaToken: data.captchaToken,
    },
  });

  if (signUpError) return toAuthFailure("signUp failed", signUpError);
  if (!authData.user) {
    console.error("[auth] signUp returned no user and no error");
    return { success: false, message: GENERIC_ERROR };
  }

  // Insert profile. Scoped service-role use: one statement, fixed columns, `id`
  // pinned to the id GoTrue just returned — never to anything the caller supplied.
  const writer = env.SUPABASE_SERVICE_ROLE_KEY ? await createClient(true) : supabase;
  const { error: profileError } = await writer
    .from("profiles")
    .insert({ id: authData.user.id, username: data.username });

  if (profileError) {
    // The auth user now exists without a profile, which also means the email
    // can't be re-registered. That non-atomicity is §5.7 and needs a Postgres
    // trigger; all we can do here is fail loudly in the logs and honestly.
    console.error("[auth] Profile creation failed after auth user was created:", profileError);
    return {
      success: false,
      message:
        "We created your login but couldn't finish setting up your profile. Contact support.",
    };
  }

  return {
    success: true,
    message: "Account created. Check your email to confirm it.",
  };
};

const sendResetPasswordEmailAction: AuthAction<ForgotPasswordFormInput> = async (
  data,
  supabase,
) => {
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    // Keep recovery links on the canonical StreamFree domain after the
    // rebrand instead of relying on a stale Supabase Site URL.
    redirectTo: `${SITE_URL}/auth/reset-password`,
    captchaToken: data.captchaToken,
  });

  if (error) return toAuthFailure("resetPasswordForEmail failed", error);

  return { success: true, message: "Password reset email sent." };
};

const resetPasswordAction: AuthAction<ResetPasswordFormInput> = async (data, supabase) => {
  const { error } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (error) return toAuthFailure("updateUser(password) failed", error);

  return { success: true, message: "Your password has been reset." };
};

export const signIn = createAuthAction(LoginFormSchema, signInWithEmailAction);
export const signUp = createAuthAction(RegisterFormSchema, signUpAction);
export const sendResetPasswordEmail = createAuthAction(
  ForgotPasswordFormSchema,
  sendResetPasswordEmailAction,
);
export const resetPassword = createAuthAction(ResetPasswordFormSchema, resetPasswordAction);

/**
 * Re-send the sign-up confirmation email.
 *
 * Backs the "Didn't get it? Resend" affordance on the check-your-email panel
 * (§5.4). Deliberately not built on `createAuthAction`: that helper hard-gates
 * on a captcha token, and the confirmation panel has no widget to mint one.
 * Supabase rate-limits `resend` server-side, which is the protection that
 * actually matters here.
 */
export const resendConfirmationEmail = async (
  formData: ResendEmailFormInput,
): Promise<AuthActionResult> => {
  const result = ResendEmailFormSchema.safeParse(formData);
  if (!result.success) {
    return {
      success: false,
      message: "Enter a valid email address.",
      fieldErrors: { email: "Enter a valid email address." },
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: result.data.email });

    if (error) return toAuthFailure("resend(signup) failed", error);

    return { success: true, message: "Sent again. Give it a minute to arrive." };
  } catch (error) {
    console.error("[auth] Unhandled error resending confirmation email:", error);
    return { success: false, message: GENERIC_ERROR };
  }
};

export const signOut = async (): ActionResponse => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[auth] signOut failed:", error);
    return { success: false, message: GENERIC_ERROR };
  }

  return { success: true, message: "You have been signed out." };
};
