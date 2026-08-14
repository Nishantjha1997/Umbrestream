import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anime player | StreamFree",
  robots: { index: false, follow: false },
};

export default function AnimePlayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
