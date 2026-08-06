import Link from "next/link";
import type { IconType } from "react-icons";

export default function ComingSoon({
  eyebrow,
  title,
  description,
  Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  Icon: IconType;
}) {
  return (
    <div className="relative -mx-3 -my-8 flex min-h-dvh items-center justify-center overflow-hidden px-5 sm:-mx-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,.26),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(37,99,235,.16),transparent_25%),#0f1014]" />
      <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,.16)_1px,transparent_1px)] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)] [background-size:30px_30px] opacity-30" />
      <div className="relative z-10 max-w-2xl text-center">
        <div className="mx-auto mb-7 flex size-24 items-center justify-center rounded-[2rem] border border-white/12 bg-white/6 text-violet-200 shadow-[0_30px_90px_rgba(94,45,180,.28)] backdrop-blur-2xl motion-safe:animate-[pulse_3s_ease-in-out_infinite]">
          <Icon className="size-11" />
        </div>
        <p className="text-xs font-semibold tracking-[0.28em] text-violet-300 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
          {description}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/8 px-6 text-sm font-medium transition-colors hover:bg-white/13 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
