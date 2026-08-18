import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Recovery links arrive before a normal authenticated session is
    // available, so the reset page must remain public while the browser
    // hydrates the temporary recovery session.
    PROTECTED_PATHS: z.string().default("/profile,/admin"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
    TMDB_ACCESS_TOKEN: z.string().optional().default(""),
    PLAYER_DIRECT_SOURCES_JSON: z.string().optional().default(""),
    PLAYER_SUBTITLE_HOSTS: z.string().optional().default(""),
    ANIVEXA_API_BASE_URL: z.string().optional().default(""),
    MIRURO_API_BASE_URL: z.string().optional().default(""),
    STREAMFREE_ANIME_ALLOWED_ORIGINS: z.string().optional().default(""),
    ANILIST_CLIENT_ID: z.string().optional().default(""),
    ANILIST_CLIENT_SECRET: z.string().optional().default(""),
    MAL_CLIENT_ID: z.string().optional().default(""),
    OAUTH_TOKEN_ENCRYPTION_KEY: z.string().optional().default(""),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(""),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(""),
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().optional(),
    NEXT_PUBLIC_AVATAR_PROVIDER_URL: z.string().optional(),
    NEXT_PUBLIC_PLAYER_ENGINE_V2: z.enum(["true", "false"]).optional().default("true"),
    NEXT_PUBLIC_PLAYER_ENGINE_V3: z.enum(["true", "false"]).optional().default("true"),
    NEXT_PUBLIC_ANIME_SOURCES_V2: z.enum(["true", "false"]).optional().default("true"),
    NEXT_PUBLIC_UMBRA_UI_V2: z.enum(["true", "false"]).optional().default("true"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    NEXT_PUBLIC_AVATAR_PROVIDER_URL: process.env.NEXT_PUBLIC_AVATAR_PROVIDER_URL,
    NEXT_PUBLIC_PLAYER_ENGINE_V2: process.env.NEXT_PUBLIC_PLAYER_ENGINE_V2,
    NEXT_PUBLIC_PLAYER_ENGINE_V3: process.env.NEXT_PUBLIC_PLAYER_ENGINE_V3,
    NEXT_PUBLIC_ANIME_SOURCES_V2: process.env.NEXT_PUBLIC_ANIME_SOURCES_V2,
    NEXT_PUBLIC_UMBRA_UI_V2: process.env.NEXT_PUBLIC_UMBRA_UI_V2,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
