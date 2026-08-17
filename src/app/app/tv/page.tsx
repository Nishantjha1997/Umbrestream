import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

const TV_APK_PATH = "/downloads/StreamFree-TV-v1.2.apk";

export const metadata: Metadata = {
  title: `Get the Android TV app | ${brand.name}`,
  description:
    "Download the signed StreamFree Android TV beta for Android TV devices, built for a D-pad remote.",
  alternates: { canonical: "/app/tv" },
};

const features = [
  {
    eyebrow: "Remote first",
    title: "Made for the D-pad",
    copy: "Large focus targets, directional navigation, focus memory, smooth row movement, hardware Back, and a dedicated server menu are designed around a TV remote.",
  },
  {
    eyebrow: "One identity",
    title: "Use the same account",
    copy: "Sign in with the same StreamFree email and password you use on the website and phone app. Movie and series saves and watch history stay with your Supabase account.",
  },
  {
    eyebrow: "Built in",
    title: "Playback compatibility first",
    copy: "Provider protection is disabled by default while compatibility is validated. External providers may still show their own promotions or pop-ups.",
  },
  {
    eyebrow: "Independent shell",
    title: "Not a website shortcut",
    copy: "The complete TV interface ships inside the APK. Internet is used for live catalogue data, account sync, artwork, source discovery, and playback.",
  },
];

const installSteps = [
  {
    number: "01",
    title: "Get the APK onto your TV",
    copy: "Download it in your TV browser, or download it on a computer and copy it to a USB drive.",
  },
  {
    number: "02",
    title: "Allow this install source",
    copy: "When Android TV asks, allow your browser or file manager to install unknown apps. This is the normal sideloading permission.",
  },
  {
    number: "03",
    title: "Install and open",
    copy: "Select the APK, approve installation, and open StreamFree TV from the Apps row on your launcher.",
  },
];

const remoteKeys = [
  ["↑ ↓ ← →", "Move focus"],
  ["OK", "Open or select"],
  ["Back", "Return or close"],
  ["Menu", "Change player server"],
];

export default function AndroidTVAppPage() {
  return (
    <div className="mx-auto max-w-7xl pt-5 pb-28 md:pt-8 md:pb-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-violet-200/18 bg-[#0d0b12] shadow-[0_34px_110px_-55px_rgba(139,92,246,.95)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(139,92,246,.28),transparent_38%),radial-gradient(circle_at_88%_22%,rgba(236,72,153,.14),transparent_32%)]" />
        <div className="relative grid items-center gap-10 px-6 py-9 sm:px-9 sm:py-12 lg:grid-cols-[.92fr_1.08fr] lg:px-12 lg:py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <Image src="/streamfree-mark.svg" alt="" width={42} height={42} aria-hidden="true" />
              <div>
                <p className="text-[11px] font-semibold tracking-[0.22em] text-violet-200 uppercase">
                  StreamFree for Android TV
                </p>
                <p className="mt-0.5 text-xs text-white/40">Android TV remote ready</p>
              </div>
            </div>

            <h1 className="mt-7 text-4xl leading-[.96] font-semibold tracking-[-0.065em] text-balance text-white sm:text-6xl lg:text-7xl">
              The cinema row, now on your biggest screen.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/64 sm:text-lg">
              A dedicated 10-foot interface with cinematic discovery, remote-first navigation, the
              same StreamFree account, and a release-safe provider compatibility mode.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium text-white/60">
              {[
                "Android TV 7.0+",
                "Android TV compatible",
                "Version 1.2.0",
                "3.15 MB",
                "Signed APK",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={TV_APK_PATH}
                download
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-200 px-6 py-3 text-sm font-bold text-violet-950 shadow-xl shadow-violet-950/35 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
              >
                Download TV APK
              </a>
              <Link
                href="/app"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/14 bg-white/[0.065] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.11] focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
              >
                Get the phone app
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/42">
              Direct sideload beta. Android TV will show its standard install-from-this-source
              confirmation.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute inset-x-10 top-8 bottom-0 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative rounded-[1.7rem] border border-white/20 bg-[#050507] p-2.5 shadow-[0_42px_90px_-35px_rgba(0,0,0,1)] sm:p-3">
              <div className="relative aspect-video overflow-hidden rounded-[1.25rem] border border-white/9 bg-[radial-gradient(circle_at_65%_28%,rgba(168,85,247,.30),transparent_34%),linear-gradient(120deg,#15101f_0%,#09080c_64%)]">
                <div className="absolute inset-y-0 left-0 w-[15%] border-r border-white/7 bg-black/25 p-[3%]">
                  <Image
                    src="/streamfree-mark.svg"
                    alt=""
                    width={34}
                    height={34}
                    aria-hidden="true"
                    className="w-[46%]"
                  />
                  <div className="mt-[45%] space-y-[28%]">
                    {[true, false, false, false, false].map((active, index) => (
                      <span
                        key={index}
                        className={`block aspect-square w-[34%] rounded-md border ${
                          active
                            ? "border-violet-200/70 bg-violet-300/28"
                            : "border-white/8 bg-white/6"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 w-[85%] p-[5%]">
                  <p className="text-[clamp(8px,1vw,13px)] font-semibold tracking-[.18em] text-violet-200 uppercase">
                    Featured tonight
                  </p>
                  <p className="mt-[3%] max-w-[62%] text-[clamp(18px,3vw,42px)] leading-[.92] font-semibold tracking-[-.05em] text-white">
                    Find the story that fills the room.
                  </p>
                  <span className="mt-[5%] inline-flex rounded-full bg-white px-[4%] py-[1.4%] text-[clamp(7px,.8vw,11px)] font-bold text-black">
                    OK&nbsp;&nbsp;Watch now
                  </span>
                  <div className="mt-[7%] flex gap-[2%]">
                    {[
                      "from-violet-500/70",
                      "from-fuchsia-500/55",
                      "from-cyan-500/45",
                      "from-amber-500/45",
                    ].map((color, index) => (
                      <span
                        key={color}
                        className={`aspect-video w-[22%] rounded-[10%] border ${
                          index === 0
                            ? "scale-105 border-violet-100 shadow-[0_0_0_3px_rgba(196,181,253,.22)]"
                            : "border-white/10"
                        } bg-linear-to-br ${color} to-black/80`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mx-auto h-5 w-[22%] bg-linear-to-b from-white/20 to-white/5 [clip-path:polygon(38%_0,62%_0,78%_100%,22%_100%)]" />
            <div className="mx-auto h-2 w-[38%] rounded-full bg-white/14" />
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="tv-features">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
          Built for the sofa
        </p>
        <h2 id="tv-features" className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white">
          Everything feels at home on TV.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
            >
              <p className="text-[11px] font-semibold tracking-[0.16em] text-violet-200 uppercase">
                {feature.eyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[1.12fr_.88fr]">
        <div className="rounded-3xl border border-white/8 bg-white/[0.025] p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
            Install on Android TV
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white">
            Three steps to the Apps row.
          </h2>
          <div className="mt-7 space-y-6">
            {installSteps.map((step) => (
              <article key={step.number} className="grid grid-cols-[44px_1fr] gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl border border-violet-200/15 bg-violet-300/10 text-xs font-bold text-violet-100">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/52">{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-violet-200/13 bg-violet-400/[0.055] p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
            Remote map
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white">
            No touch screen needed.
          </h2>
          <dl className="mt-7 grid gap-3">
            {remoteKeys.map(([key, action]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/18 px-4 py-3"
              >
                <dt className="rounded-lg border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-bold text-white">
                  {key}
                </dt>
                <dd className="text-sm text-white/56">{action}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 text-sm leading-6 text-white/58 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Accounts and sync</h2>
          <p className="mt-3">
            The TV app reads the same live Supabase configuration as StreamFree on the web. Existing
            credentials work immediately, and movie and series watchlists and watch history sync
            across web, phone, and TV. Anime saves remain local during this beta until the shared
            database schema is extended.
          </p>
        </article>
        <article className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 text-sm leading-6 text-white/58 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Verified updates</h2>
          <p className="mt-3">
            Version 1.2.0 is a release APK signed for direct installation. The in-app updater
            fetches and validates the official manifest, package identity, version, certificate,
            size, and SHA-256 before installation. Android TV can still show its standard
            unknown-source or Play Protect confirmation. Release fingerprints are kept in the
            project release metadata and are not shown on the download page.
          </p>
        </article>
      </section>

      <div className="mt-10 flex flex-col items-center rounded-2xl border border-violet-200/14 bg-violet-400/[0.07] p-6 text-center sm:p-8">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-white">
          Ready for movie night?
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
          Download the signed TV installer, sideload it once, and sign in with your existing
          StreamFree account.
        </p>
        <a
          href={TV_APK_PATH}
          download
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-200 px-6 py-3 text-sm font-bold text-violet-950 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
        >
          Download StreamFree TV APK
        </a>
      </div>
    </div>
  );
}
