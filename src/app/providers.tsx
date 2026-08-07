"use client";

import { PropsWithChildren, Suspense } from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { AmbientProvider } from "@/components/media/AmbientProvider";
import { useRouter } from "next/navigation";
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
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
        >
          {/* https://github.com/vercel/next.js/discussions/61654#discussioncomment-8480088 */}
          <Suspense>
            {/* One accent (Phase 1, §1.1.3 / §5.2): the loading bar no longer
                picks warning-vs-primary by whether the route is TV. */}
            <ProgressProvider options={{ showSpinner: false }} color="hsl(var(--heroui-primary))">
              {/* Context only, no DOM (Phase 1) — the visual layers
                  (`<AmbientLayers>`) mount separately inside
                  `ImmersiveAppShell`'s `position: relative` root, where an
                  `inset-0` layer actually has something to size against. */}
              <AmbientProvider>{children}</AmbientProvider>
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
