import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Resolve-and-compare rather than prefix-match: `/\\evil.com` survives a
  // `startsWith("//")` check but the URL parser folds the backslash into the
  // authority, so `redirect()` would send the browser to evil.com — an open
  // redirect on an *email-confirmation* link, which is about as trustworthy a
  // context as a phisher could ask for.
  const requested = searchParams.get("next");
  let next = "/";
  if (requested) {
    try {
      const url = new URL(requested, request.nextUrl.origin);
      if (url.origin === request.nextUrl.origin) {
        next = `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      next = "/";
    }
  }

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    // Log the failure only, and only its code — the success path logged an
    // object on every confirmation, and a raw Supabase auth error can carry the
    // submitted address and token material.
    if (error) console.error("[auth] verifyOtp failed:", error.code ?? error.status);

    if (!error) {
      return redirect(next);
    }
  }

  return redirect("/auth?error=true");
};
