import { env } from "./env";

/**
 * Whether Cloudflare Turnstile is actually configured.
 *
 * The auth forms previously hard-required a captcha token before submitting:
 * the first click set `isVerifying`, which mounted Turnstile, whose
 * `onSuccess` then re-invoked submit. With no site key Turnstile fails
 * immediately ("Invalid input for parameter \"sitekey\", got \"\""), so
 * `onSuccess` never fired and **login was impossible** — the button just sat
 * on "Verifying...".
 *
 * Captcha is optional (see .env.local.example). When it isn't configured the
 * forms must submit directly rather than waiting for a token that can never
 * arrive.
 */
export const isCaptchaEnabled: boolean = Boolean(env.NEXT_PUBLIC_CAPTCHA_SITE_KEY);

/** Safe to read only when `isCaptchaEnabled` is true. */
export const CAPTCHA_SITE_KEY: string = env.NEXT_PUBLIC_CAPTCHA_SITE_KEY ?? "";
