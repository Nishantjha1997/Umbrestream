import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

/** The only account permitted to view or query the Umbra admin area. */
export const ADMIN_EMAIL = "nishantjha31@gmail.com";

export type AdminAccess = "anonymous" | "forbidden" | "allowed";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function getAdminAccess(): Promise<AdminAccess> {
  if (!isSupabaseConfigured) return "anonymous";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return "anonymous";
    return isAdminEmail(user.email) ? "allowed" : "forbidden";
  } catch (error) {
    console.error("[admin] Access check failed:", error);
    return "anonymous";
  }
}
