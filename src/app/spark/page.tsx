import ComingSoon from "@/components/sections/Preview/ComingSoon";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { HiOutlineSparkles } from "react-icons/hi2";

export const metadata: Metadata = { title: `Sparks Preview | ${siteConfig.name}` };

export default function SparksPage() {
  return (
    <ComingSoon
      eyebrow="Short-form discovery"
      title="Sparks"
      description="A cinematic stream of trailers, scenes, and recommendations is coming soon—designed for discovery without noisy autoplay or wasted bandwidth."
      Icon={HiOutlineSparkles}
    />
  );
}
