import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/brand";

const PUBLIC_ROUTES = [
  "/",
  "/search",
  "/browse",
  "/browse?tab=films",
  "/browse?tab=series",
  "/browse?tab=categories",
  "/anime",
  "/anime/discover",
  "/discover",
  "/about",
  "/dmca",
  "/sports",
  "/spark",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route === "/about" || route === "/dmca" ? 0.4 : 0.8,
  }));
}
