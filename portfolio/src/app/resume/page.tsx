import Link from "next/link";

export const metadata = { title: "Resume", description: "Resume of Nishant Jha — Executive, Founder's Office and AI automation builder." };

export default function ResumePage() {
  return <section className="page-shell simple-page"><Link className="back-link" href="/">← Back home</Link><p className="eyebrow">DOCUMENT / RESUME</p><h1>The short <em>version.</em></h1><p className="detail-summary">A concise overview of executive operations, cross-functional delivery, automation systems, and hands-on product work.</p><div className="resume-panel"><div><span className="file-mark">PDF</span><div><strong>Nishant Jha — Resume</strong><p>Founder&apos;s Office · Executive Operations · AI Automation</p></div></div><a className="button button-primary" href="/api/resume" download>Download resume <span aria-hidden="true">↓</span></a></div><p className="fine-print">The public page does not display personal contact details. The downloadable resume contains the complete information intended for recruiting use.</p></section>;
}
