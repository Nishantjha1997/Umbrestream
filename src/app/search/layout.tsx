import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search | StreamFree",
  robots: { index: false, follow: false },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
