import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Umbra",
  description: "Browse movies, TV and anime.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full font-[family-name:var(--font-inter)]">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
