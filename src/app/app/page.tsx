import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

const APK_PATH = "/downloads/StreamFree-local-debug.apk";
const APK_SHA256 = "0D5CEC4955F1F7B149B5A778720797236640AF4D00E482547DB19C45C30F269D";

export const metadata: Metadata = {
  title: `Get the Android app | ${brand.name}`,
  description:
    "Explore the StreamFree Android app, review its features, and download the signed beta APK.",
  alternates: { canonical: "/app" },
};

const features = [
  {
    title: "One account everywhere",
    copy: "Sign in with the same StreamFree email and password. Your movie and series library and watch history sync through the same Supabase account.",
  },
  {
    title: "Native Android feel",
    copy: "A cinematic launch, glass tab transitions, swipe navigation, press ripples, haptics, and hardware-back support make every screen feel at home on Android.",
  },
  {
    title: "The complete mobile experience",
    copy: "Home rails, recommendations, search, browse filters, anime, cast, trailers, seasons, episodes, multiple player servers, library, history, and settings are all included.",
  },
  {
    title: "Independent app shell",
    copy: "The interface ships inside the APK instead of loading the website. Internet is used only for live catalogue data, account sync, artwork, and streaming.",
  },
];

const installSteps = [
  ["1", "Download", "Tap the APK button and keep the file when your browser asks."],
  [
    "2",
    "Allow this source",
    "If Android asks, allow your browser or Files app to install unknown apps.",
  ],
  [
    "3",
    "Install and open",
    "Open the downloaded APK, approve installation, then launch StreamFree.",
  ],
];

export default function AndroidAppPage() {
  return (
    <div className="mx-auto max-w-6xl pt-5 pb-28 md:pt-8 md:pb-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-violet-200/20 bg-linear-to-br from-violet-500/25 via-[#1b1425] to-[#0d0c10] p-6 shadow-[0_30px_90px_-52px_rgba(168,85,247,.95)] sm:p-9 lg:grid lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-10 lg:p-12">
        <div className="absolute -top-28 -right-16 size-80 rounded-full bg-violet-300/18 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 size-80 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-200 uppercase">
            StreamFree for Android
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-balance text-white sm:text-6xl">
            Your next watch, built for your phone.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
            Browse and play from a dedicated Android interface with a cinematic launch, native
            navigation, and the same StreamFree account you already use on the web.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium text-white/62">
            {[
              "Android 7.0+",
              "Beta 1.1",
              "4.06 MB",
              "Shared account sync",
              "Internet required for catalogue and streaming",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-black/22 px-3 py-1.5"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={APK_PATH}
              download
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-200 px-6 py-3 text-sm font-bold text-violet-950 shadow-xl shadow-violet-950/30 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
            >
              Download signed APK
            </a>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/14 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
            >
              Explore the website
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/45">
            Direct beta install. Android may ask you to allow installation from your browser or
            Files app.
          </p>
        </div>

        <div className="relative z-10 mx-auto mt-10 w-full max-w-[330px] lg:mt-0">
          <div className="absolute inset-8 rounded-full bg-violet-400/22 blur-3xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-white/18 bg-[#09080c] p-3 shadow-[0_35px_85px_-32px_rgba(0,0,0,1)]">
            <div className="rounded-[25px] border border-white/8 bg-linear-to-b from-[#1d1728] to-[#0b0a0f] px-4 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/streamfree-mark.svg"
                    alt=""
                    width={28}
                    height={28}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold tracking-[0.12em] text-white">
                    STREAMFREE
                  </span>
                </div>
                <span className="size-8 rounded-full border border-white/10 bg-white/7" />
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-violet-500/30 to-rose-500/10 p-4">
                <p className="text-[9px] tracking-[0.16em] text-violet-200 uppercase">
                  Tonight&apos;s pick
                </p>
                <p className="mt-10 max-w-[180px] text-2xl leading-[.95] font-semibold tracking-[-0.04em] text-white">
                  A better way to find what&apos;s next.
                </p>
                <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-bold text-black">
                  Play now
                </span>
              </div>
              <p className="mt-5 text-xs font-semibold text-white">Trending now</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["from-violet-500/45", "from-rose-500/40", "from-cyan-500/35"].map((color) => (
                  <span
                    key={color}
                    className={`aspect-2/3 rounded-xl border border-white/8 bg-linear-to-b ${color} to-black/60`}
                  />
                ))}
              </div>
              <div className="mt-5 grid grid-cols-5 gap-2 border-t border-white/8 pt-3 text-center text-[8px] text-white/42">
                {["Home", "Search", "Browse", "Anime", "You"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-7 overflow-hidden rounded-3xl border border-fuchsia-200/14 bg-linear-to-br from-fuchsia-500/[0.13] via-violet-500/[0.08] to-white/[0.025] p-5 sm:p-7 lg:flex lg:items-center lg:justify-between lg:gap-8">
        <div className="absolute -top-20 right-8 size-52 rounded-full bg-fuchsia-400/12 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-fuchsia-200 uppercase">
            Also on the big screen
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            StreamFree TV is ready for Mi TV remotes.
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/58">
            Get a separate Android TV build with D-pad navigation, the same account credentials, and
            always-on TV ad protection.
          </p>
        </div>
        <div className="relative mt-5 flex shrink-0 flex-wrap gap-3 lg:mt-0">
          <Link
            href="/app/tv"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
          >
            Explore the TV app
          </Link>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="android-features">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
          Inside the app
        </p>
        <h2
          id="android-features"
          className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white"
        >
          More than a website shortcut.
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
            >
              <span className="text-xs font-semibold text-violet-200">0{index + 1}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="install-heading">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
          Installation
        </p>
        <h2
          id="install-heading"
          className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white"
        >
          From download to launch in three steps.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {installSteps.map(([number, title, copy]) => (
            <article
              key={number}
              className="rounded-2xl border border-white/8 bg-white/[0.035] p-5"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-violet-300/15 text-sm font-bold text-violet-100">
                {number}
              </span>
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 text-sm leading-6 text-white/58 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Connection and accounts</h2>
          <p className="mt-3">
            The interface is bundled in the APK, while posters, title details, source discovery, and
            streaming still require an internet connection. Sign in with your existing website
            account to sync movie and series saves and watch history through the same Supabase
            project. Anime saves remain on the device during this beta while the shared database
            schema is extended.
          </p>
        </article>
        <article className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 text-sm leading-6 text-white/58 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Signed beta details</h2>
          <p className="mt-3">
            Version 1.1 is APK Signature Scheme v2 debug-signed for direct installation. It is not a
            Play Store release, so Android can still show its normal install-from-this-source or
            Play Protect confirmation.
          </p>
          <p className="mt-3 text-xs text-white/42">SHA-256</p>
          <code className="mt-1 block text-xs leading-5 break-all text-violet-200">
            {APK_SHA256}
          </code>
        </article>
      </section>

      <div className="mt-10 flex flex-col items-center rounded-2xl border border-violet-200/14 bg-violet-400/[0.07] p-6 text-center sm:p-8">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-white">
          Ready to try the Android beta?
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
          Download the signed installer directly to your Android phone.
        </p>
        <a
          href={APK_PATH}
          download
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-200 px-6 py-3 text-sm font-bold text-violet-950 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
        >
          Download StreamFree APK
        </a>
      </div>
    </div>
  );
}
