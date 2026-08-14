"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

const WORDMARK = "STREAMFREE".split("");

export default function CinematicSplash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setVisible(false), reducedMotion ? 900 : 3_250);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible || pathname.includes("/player") || pathname.startsWith("/auth")) return null;

  return (
    <div className="cinematic-splash" role="status" aria-label="StreamFree is loading">
      <div className="splash-noise" aria-hidden="true" />
      <div className="splash-spotlight" aria-hidden="true" />
      <div className="splash-filmstrip splash-filmstrip-one" aria-hidden="true" />
      <div className="splash-filmstrip splash-filmstrip-two" aria-hidden="true" />

      <div className="splash-posters" aria-hidden="true">
        {["violet", "rose", "amber", "cyan", "indigo"].map((tone, index) => (
          <span key={tone} className={`splash-poster splash-poster-${index + 1} splash-tone-${tone}`}>
            <span className="splash-poster-line" />
          </span>
        ))}
      </div>

      <div className="splash-center">
        <div className="splash-reel" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <svg viewBox="0 0 64 64" fill="none" className="splash-mark">
            <path d="M12 14h36v9H23v6h20v9H23v8h27v9H12V14Z" fill="currentColor" />
            <path d="m43 20 12 8-12 8V20Z" fill="white" />
          </svg>
        </div>

        <div className="splash-wordmark" aria-label="StreamFree">
          {WORDMARK.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              style={{ "--splash-delay": `${620 + index * 55}ms` } as CSSProperties}
            >
              {letter}
            </span>
          ))}
        </div>
        <p className="splash-tagline">Lights&nbsp;&nbsp;•&nbsp;&nbsp;Camera&nbsp;&nbsp;•&nbsp;&nbsp;Stream</p>
        <div className="splash-progress" aria-hidden="true">
          <span />
        </div>
      </div>

      <div className="splash-curtain splash-curtain-left" aria-hidden="true" />
      <div className="splash-curtain splash-curtain-right" aria-hidden="true" />
    </div>
  );
}
