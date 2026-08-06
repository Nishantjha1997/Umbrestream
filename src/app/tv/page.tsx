import MediaHub from "@/components/media/MediaHub";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: `TV Shows | ${siteConfig.name}` };

export default function TvLandingPage() {
  return <MediaHub kind="tv" />;
}
