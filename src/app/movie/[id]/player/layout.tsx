import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movie player | StreamFree",
  robots: { index: false, follow: false },
};

export default function MoviePlayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
