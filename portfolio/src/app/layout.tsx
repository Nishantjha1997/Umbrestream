import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nishant.top";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nishant Jha — Founder's Office, Executive Operations & AI Automation",
    template: "%s | Nishant Jha",
  },
  description: "Nishant Jha is an Executive in the Founder's Office at CallHippo, building AI-enabled operations, automation, internal tools, and thoughtful digital products.",
  keywords: ["Nishant Jha", "Founder's Office", "Executive Operations", "AI Automation", "Business Operations", "Process Improvement", "Internal Tools"],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Nishant Jha — Executive Operations & AI Automation",
    description: "Executive operations, cross-functional delivery, and practical automation systems.",
    siteName: "Nishant Jha",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Nishant Jha",
    jobTitle: "Executive, Founder's Office",
    worksFor: { "@type": "Organization", name: "CallHippo" },
    url: siteUrl,
    sameAs: ["https://github.com/Nishantjha1997", "https://streamfree.online/", "https://flowcreate-similar-dream.vercel.app/"],
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer"><span>© {new Date().getFullYear()} Nishant Jha</span><span>Built with curiosity, systems thinking, and care.</span></footer>
      </body>
    </html>
  );
}
