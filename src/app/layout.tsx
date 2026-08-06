import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
// Inter Variable's @font-face rules (§1.4). Imported before `globals.css` so
// the faces are declared ahead of the stylesheet that binds them to
// `--font-sans`; the family itself is applied via Tailwind's default sans, so
// no wrapper class is needed. The wordmark also uses this local family.
import "@fontsource-variable/inter";
import "../styles/globals.css";
import "../styles/lightbox.css";
import Providers from "./providers";
import TopNavbar from "@/components/ui/layout/TopNavbar";
import BottomNavbar from "@/components/ui/layout/BottomNavbar";
import Sidebar from "@/components/ui/layout/Sidebar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { cn } from "@/utils/helpers";
import { SpacingClasses } from "@/utils/constants";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import ImmersiveAppShell from "@/components/ui/layout/ImmersiveAppShell";

const UMBRA_UI_V2_ENABLED = process.env.NEXT_PUBLIC_UMBRA_UI_V2 !== "false";

export const metadata: Metadata = {
  title: siteConfig.name,
  applicationName: siteConfig.name,
  description: siteConfig.description,
  manifest: "/manifest.json",
  icons: {
    icon: siteConfig.favicon,
    apple: [{ url: "/icons/ios/180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  twitter: {
    card: "summary",
    title: {
      default: siteConfig.name,
      template: siteConfig.name,
    },
    description: siteConfig.description,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: {
      default: siteConfig.name,
      template: siteConfig.name,
    },
    description: siteConfig.description,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1014",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className="min-h-dvh overflow-x-hidden bg-[#0f1014] font-sans text-white antialiased select-none">
        <Suspense>
          <NuqsAdapter>
            <Providers>
              {UMBRA_UI_V2_ENABLED ? (
                <ImmersiveAppShell>{children}</ImmersiveAppShell>
              ) : (
                <>
                  <TopNavbar />
                  <Sidebar>
                    <main className={cn("container mx-auto max-w-full", SpacingClasses.main)}>
                      {children}
                    </main>
                  </Sidebar>
                </>
              )}
              <InstallAppPrompt />
              {!UMBRA_UI_V2_ENABLED && <BottomNavbar />}
            </Providers>
          </NuqsAdapter>
        </Suspense>
        <SpeedInsights debug={false} />
        <Analytics debug={false} />
      </body>
    </html>
  );
}
