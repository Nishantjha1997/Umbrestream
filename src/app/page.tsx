import { headers } from "next/headers";
import HomeClient from "@/components/shell/HomeClient";

/**
 * Server component that detects mobile user-agent to seed the initial viewport
 * snapshot, avoiding desktop-to-phone layout flash on mobile devices.
 */
export default async function HomePage() {
  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "";
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return <HomeClient initialIsPhone={isMobile} />;
}
