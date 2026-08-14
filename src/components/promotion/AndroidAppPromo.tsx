import Link from "next/link";

export default function AndroidAppPromo() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-200/20 bg-linear-to-br from-violet-500/22 via-[#20162b] to-[#0f0d14] px-5 py-5 shadow-[0_22px_54px_-38px_rgba(168,85,247,.9)] sm:px-6 md:px-8">
      <div className="absolute -top-20 -right-12 size-48 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
            Now on Android
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-white sm:text-2xl">
            StreamFree is now on phones and Android TV.
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Explore both dedicated builds, including a remote-first TV interface with the same
            account login.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/app"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/16 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
          >
            Choose your app
          </Link>
          <a
            href="/downloads/StreamFree-Android-v1.2.apk"
            download
            className="rounded-xl bg-violet-200 px-4 py-2.5 text-sm font-bold text-violet-950 shadow-lg shadow-violet-950/25 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
          >
            Download APK
          </a>
        </div>
      </div>
    </section>
  );
}
