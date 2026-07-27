// Does createServerClient throw when the URL/key are empty strings?
// This is what happens in middleware when Vercel env vars aren't set, since
// env.ts defaults these to "".
import { createServerClient } from "@supabase/ssr";

try {
  createServerClient("", "", {
    cookies: { getAll: () => [], setAll: () => {} },
  });
  console.log("NO THROW — empty strings accepted");
} catch (err) {
  console.log(`THROWS: ${err.message}`);
}
