import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    PROTECTED_PATHS: z.string().default("/auth/reset-password,/profile"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
    TMDB_ACCESS_TOKEN: z.string().optional().default(""),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(""),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(""),
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().optional(),
    NEXT_PUBLIC_AVATAR_PROVIDER_URL: z.string().optional(),
    NEXT_PUBLIC_PLAYER_ENGINE_V2: z.enum(["true", "false"]).optional().default("true"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    NEXT_PUBLIC_AVATAR_PROVIDER_URL: process.env.NEXT_PUBLIC_AVATAR_PROVIDER_URL,
    NEXT_PUBLIC_PLAYER_ENGINE_V2: process.env.NEXT_PUBLIC_PLAYER_ENGINE_V2,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
