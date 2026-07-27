"use client";

import { PropsWithChildren, Suspense } from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { useState } from "react";

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            // Retrying a misconfiguration just makes the UI hang. A missing
            // TMDB_ACCESS_TOKEN makes /api/tmdb return 503 "Server not
            // configured"; three retries with backoff kept every shelf stuck
            // on a skeleton for ~10s before finally showing nothing, which
            // reads as "very slow" rather than "broken". Fail fast on anything
            // that won't fix itself.
            retry: (failureCount, error) => {
              const status = (error as { status?: number })?.status;
              const message = error instanceof Error ? error.message : "";
              const permanent =
                status === 401 ||
                status === 403 ||
                status === 404 ||
                status === 503 ||
                /\b(401|403|404|503)\b/.test(message);
              if (permanent) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );
  const { push } = useRouter();
  const pathName = usePathname();
  const [content] = useQueryState(
    "content",
    parseAsStringLiteral(["movie", "tv", "anime"] as const).withDefault("movie"),
  );
  const tv = pathName.includes("/tv/") || content === "tv";

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={push}>
        <ToastProvider
          placement="top-right"
          maxVisibleToasts={1}
          toastOffset={10}
          toastProps={{
            shouldShowTimeoutProgress: true,
            timeout: 5000,
            classNames: {
              content: "mr-7",
              closeButton:
                "opacity-100 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto",
            },
          }}
        />
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* https://github.com/vercel/next.js/discussions/61654#discussioncomment-8480088 */}
          <Suspense>
            <ProgressProvider
              options={{ showSpinner: false }}
              color={`hsl(var(--heroui-${tv ? "warning" : "primary"}))`}
            >
              {children}
            </ProgressProvider>
          </Suspense>
        </NextThemesProvider>
      </HeroUIProvider>
      <div className="hidden md:block">
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </QueryClientProvider>
  );
}
