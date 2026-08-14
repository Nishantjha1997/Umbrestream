import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { brand, SITE_URL } from "@/config/brand";
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
import SiteActivityTracker from "@/components/analytics/SiteActivityTracker";
import CinematicSplash from "@/components/ui/feedback/CinematicSplash";

const UMBRA_UI_V2_ENABLED = process.env.NEXT_PUBLIC_UMBRA_UI_V2 !== "false";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteConfig.seoTitle,
    // Child routes already provide their complete branded titles.
    template: "%s",
  },
  applicationName: siteConfig.name,
  authors: [{ name: brand.creatorName, url: "https://github.com/Nishantjha1997" }],
  creator: brand.creatorName,
  publisher: siteConfig.name,
  category: "entertainment",
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: siteConfig.favicon,
    apple: [{ url: "/streamfree-mark.svg", type: "image/svg+xml" }],
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
    title: siteConfig.seoTitle,
    description: siteConfig.description,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.seoTitle,
    description: siteConfig.description,
    url: SITE_URL,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Matches `globals.css`'s `html`/`body` background and `hero.ts`'s
  // `dark.colors.background` (§A.2, Phase 1) — one base surface value.
  themeColor: "#0a090d",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  /** The `@modal` parallel-route slot (Phase 2, §6) — see `src/app/@modal/default.tsx`
      and `ImmersiveAppShell.tsx` for what renders here and why. */
  modal: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.name,
              alternateName: "StreamFree",
              url: SITE_URL,
              description: siteConfig.description,
              creator: { "@type": "Person", name: brand.creatorName },
            }),
          }}
        />
      </head>
      <body className="min-h-dvh overflow-x-hidden bg-[#0a090d] font-sans text-white antialiased select-none">
        <Suspense>
          <CinematicSplash />
          <NuqsAdapter>
            <Providers>
              {UMBRA_UI_V2_ENABLED ? (
                <ImmersiveAppShell modal={modal}>{children}</ImmersiveAppShell>
              ) : (
                <>
                  <TopNavbar />
                  <Sidebar>
                    <main className={cn("container mx-auto max-w-full", SpacingClasses.main)}>
                      {children}
                    </main>
                  </Sidebar>
                  {modal}
                </>
              )}
              <InstallAppPrompt />
              <SiteActivityTracker />
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
