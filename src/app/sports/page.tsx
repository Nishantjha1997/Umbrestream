import ComingSoon from "@/components/sections/Preview/ComingSoon";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { TbBallFootball } from "react-icons/tb";

export const metadata: Metadata = { title: `Sports Preview | ${siteConfig.name}` };

export default function SportsPage() {
  return (
    <ComingSoon
      eyebrow="Live experiences in progress"
      title="Sports"
      description="A fast, match-first sports space is taking shape. We will only launch it when the feeds and schedules meet Umbra’s reliability standard."
      Icon={TbBallFootball}
    />
  );
}
