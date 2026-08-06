import MediaHub from "@/components/media/MediaHub";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: `Movies | ${siteConfig.name}` };

export default function MoviesPage() {
  return <MediaHub kind="movie" />;
}
