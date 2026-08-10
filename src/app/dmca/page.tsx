import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `DMCA & Copyright Notice | ${siteConfig.name}`,
  description:
    "Umbra Stream's copyright and DMCA notice explains how rights holders can report a specific concern for review.",
  alternates: { canonical: "/dmca" },
};

const CONTACT_EMAIL = "nishantjha31@gmail.com";

export default function DmcaPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 pb-28 sm:px-6 md:py-16 md:pb-16">
      <header className="flex flex-col gap-4">
        <p className="text-xs font-semibold tracking-[0.24em] text-violet-300 uppercase">
          Umbra Stream legal
        </p>
        <h1 className="font-serif text-5xl leading-none tracking-tight sm:text-6xl">
          DMCA &amp; Copyright Notice
        </h1>
        <p className="max-w-2xl text-base leading-7 text-white/60">
          Umbra Stream is an entertainment discovery interface. We do not knowingly host or store
          movie, television, or anime video files on our own servers. Playback may be provided by
          independently operated third-party services.
        </p>
      </header>

      <div className="flex flex-col gap-7 text-sm leading-7 text-white/70">
        <section className="glass-panel rounded-(--radius-panel) border p-5 sm:p-7">
          <h2 className="mb-2 text-lg font-semibold text-white">How to report a concern</h2>
          <p>
            If you are a copyright owner or authorized representative and believe a specific link
            on Umbra Stream should be reviewed, send a notice to{" "}
            <a
              className="font-medium text-violet-200 underline decoration-violet-300/40 underline-offset-4 hover:text-white"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            . Include enough information for us to identify the page and understand your rights.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">A complete notice should include</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Your name, organization, and contact information.</li>
            <li>The copyrighted work or works you represent.</li>
            <li>The exact Umbra Stream URL and the specific material at issue.</li>
            <li>A statement that you have a good-faith belief the use is unauthorized.</li>
            <li>A statement that the information in the notice is accurate and that you are authorized to act.</li>
            <li>Your physical or electronic signature.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">Review process</h2>
          <p>
            We review complete, specific notices and may remove or disable a page link while the
            concern is assessed. Because third-party providers control their own embeds and files,
            a report may also need to be sent to the provider or host that controls the material.
            We may request clarification when a notice does not identify a specific page or right.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">Important limitation</h2>
          <p>
            This notice is provided for transparency and a practical reporting path; it is not a
            guarantee of legal compliance or legal advice. Site operators should obtain advice
            appropriate to their jurisdiction and keep this policy aligned with their actual
            hosting, provider, and takedown practices.
          </p>
        </section>
      </div>

      <Link
        href="/about#disclaimer"
        className="w-fit rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        Read the full site disclaimer
      </Link>
    </article>
  );
}
