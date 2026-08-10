import type { MetadataRoute } from "next";

const SITE_URL = "https://umbrestream.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
