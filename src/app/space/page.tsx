import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";
import {
  FiActivity,
  FiClock,
  FiDownload,
  FiHelpCircle,
  FiInfo,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { FiBarChart2 } from "react-icons/fi";
import { getAdminAccess } from "@/lib/admin";
import RegionPreference from "@/components/sections/Settings/RegionPreference";
import AnimeConnections from "@/components/sections/Settings/AnimeConnections";

export const metadata: Metadata = { title: `My Space | ${siteConfig.name}` };

const items = [
  { title: "Library", copy: "Saved movies, TV, and Anime", href: "/library", Icon: FiClock },
  { title: "Profile", copy: "Sign in and manage your account", href: "/auth", Icon: FiUser },
  {
    title: "Watch History",
    copy: "Minutes watched, per title and in total",
    href: "/space/history",
    Icon: FiActivity,
  },
  {
    title: "Playback settings",
    copy: "Theme-free, distraction-free playback",
    href: "/space#settings",
    Icon: FiSettings,
  },
  {
    title: "Install StreamFree",
    copy: "Add StreamFree to your iPhone home screen",
    href: "/space#install",
    Icon: FiDownload,
  },
  { title: "Help", copy: "Playback and server guidance", href: "/about", Icon: FiHelpCircle },
  { title: "About", copy: "StreamFree, privacy, and project details", href: "/about", Icon: FiInfo },
];

export default async function MySpacePage() {
  const isAdmin = (await getAdminAccess()) === "allowed";
  const visibleItems = isAdmin
    ? [
        ...items,
        {
          title: "Admin analytics",
          copy: "Private traffic and playback monitoring",
          href: "/admin",
          Icon: FiBarChart2,
        },
      ]
    : items;

  return (
    <div className="mx-auto max-w-5xl pt-6 pb-28 md:pt-12 md:pb-12">
      <p className="text-xs font-semibold tracking-[0.24em] text-violet-300 uppercase">
        Your StreamFree
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">My Space</h1>
      <p className="mt-4 max-w-xl text-white/55">
        Everything personal stays together: library, playback preferences, installation, and help.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map(({ title, copy, href, Icon }) => (
          <Link
            key={title}
            href={href}
            className="group min-h-40 rounded-2xl border border-white/8 bg-white/[0.035] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
          >
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/8 bg-black/25 text-violet-200 transition-transform duration-300 group-hover:scale-110">
              <Icon className="size-5" />
            </span>
            <h2 className="mt-5 font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-white/45">{copy}</p>
          </Link>
        ))}
      </div>

      <section
        id="install"
        className="mt-12 scroll-mt-24 rounded-3xl border border-white/8 bg-linear-to-br from-violet-500/12 to-transparent p-6 sm:p-8"
      >
        <h2 className="text-xl font-semibold">Install on iPhone</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
          Open StreamFree in Safari, tap Share, choose Add to Home Screen, then tap Add. StreamFree launches
          standalone with safe-area-aware navigation and playback.
        </p>
      </section>
      <section
        id="settings"
        className="mt-4 scroll-mt-24 rounded-3xl border border-white/8 bg-white/[0.035] p-6 sm:p-8"
      >
        <h2 className="text-xl font-semibold">Playback defaults</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">
          StreamFree remembers the last provider that played successfully during your session, keeps
          manual server choices pinned, and stops after one complete fallback pass.
        </p>
        <RegionPreference />
      </section>
      <AnimeConnections />
    </div>
  );
}
