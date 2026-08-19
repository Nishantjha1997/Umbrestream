import { FaGithub } from "react-icons/fa6";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { NextPage } from "next";
const FAQ = dynamic(() => import("@/components/sections/About/FAQ"));
const AboutDisclaimer = dynamic(() => import("@/components/sections/About/Disclaimer"));

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
  description:
    "Learn about StreamFree, a movie, TV series, and anime discovery experience created by Nishant, with dedicated Android and Android TV apps.",
  keywords: ["about StreamFree", "StreamFree Android app", "StreamFree Android TV", "Nishant StreamFree"],
  alternates: { canonical: "/about" },
};

const AboutPage: NextPage = () => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <section className="rounded-3xl border border-violet-200/15 bg-linear-to-br from-violet-500/16 via-white/4 to-transparent p-6 sm:p-9">
          <p className="text-xs font-semibold tracking-[0.22em] text-violet-200 uppercase">About StreamFree</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            A calmer way to find your next story.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/65">
            StreamFree brings movies, TV series, and anime discovery into one focused experience. We combine regional trends, personal watch history, episode browsing, saved titles, and multiple playback providers so you can spend less time searching and more time watching.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/app" className="rounded-2xl border border-white/12 bg-black/20 p-4 transition hover:border-violet-200/45">
              <span className="text-xs font-semibold tracking-[0.16em] text-violet-200 uppercase">Phone app</span>
              <strong className="mt-2 block text-white">StreamFree for Android</strong>
              <span className="mt-1 block text-sm text-white/50">Native navigation, watch history, updates, and mobile playback.</span>
            </Link>
            <Link href="/app/tv" className="rounded-2xl border border-white/12 bg-black/20 p-4 transition hover:border-violet-200/45">
              <span className="text-xs font-semibold tracking-[0.16em] text-violet-200 uppercase">Living room app</span>
              <strong className="mt-2 block text-white">StreamFree for Android TV</strong>
              <span className="mt-1 block text-sm text-white/50">Remote-first browsing, immersive playback, and next-episode flow.</span>
            </Link>
          </div>
          <p className="mt-7 font-[cursive] text-lg text-violet-200/80 italic">Created with love by {brand.creatorName}</p>
        </section>
        <Suspense>
          <FAQ />
        </Suspense>
        <Suspense>
          <AboutDisclaimer />
        </Suspense>
        <Link
          target="_blank"
          href={siteConfig.socials.github}
          aria-label="StreamFree on GitHub"
          className="flex justify-center"
        >
          <FaGithub size={30} />
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
