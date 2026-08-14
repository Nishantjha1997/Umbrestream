import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Space | StreamFree",
  robots: { index: false, follow: false },
};

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
