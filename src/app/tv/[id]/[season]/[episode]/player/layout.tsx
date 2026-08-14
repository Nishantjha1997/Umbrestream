import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TV player | StreamFree",
  robots: { index: false, follow: false },
};

export default function TvPlayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
