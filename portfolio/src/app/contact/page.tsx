import Link from "next/link";

export const metadata = { title: "Contact", description: "Get in touch with Nishant Jha about operations, automation, and product work." };

export default function ContactPage() {
  return <section className="page-shell simple-page contact-page"><Link className="back-link" href="/">← Back home</Link><p className="eyebrow">CONTACT / OPEN DOOR</p><h1>Let&apos;s make something <em>move.</em></h1><p className="detail-summary">For work, collaboration, or a thoughtful conversation about operations and automation, email is the best place to start.</p><a className="contact-email" href="mailto:nishantjha31@gmail.com">nishantjha31@gmail.com <span aria-hidden="true">↗</span></a><div className="contact-links"><a href="https://github.com/Nishantjha1997" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/nishantjha1997/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></section>;
}
