import Link from "next/link";
import { Mark } from "./Mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Nishant Jha home">
        <Mark small />
        <span>Nishant Jha</span>
      </Link>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/#work">Work</Link>
        <Link href="/labs/ai-tts">Labs</Link>
        <Link href="/resume">Resume</Link>
        <Link className="nav-cta" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
