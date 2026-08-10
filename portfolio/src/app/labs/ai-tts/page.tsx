import Link from "next/link";

export const metadata = { title: "AI TTS Lab", description: "An exploratory AI text-to-speech capability showcase by Nishant Jha." };

export default function AiTtsPage() {
  return <section className="page-shell lab-page"><Link className="back-link" href="/">← Back home</Link><p className="eyebrow">LAB / AUDIO INTERFACES</p><h1>AI TTS, made <em>human.</em></h1><p className="detail-summary">An exploratory capability from my earlier portfolio work: turning written ideas into audio that feels clear, immediate, and useful.</p><div className="tts-card"><div className="waveform" aria-hidden="true">{Array.from({ length: 44 }, (_, i) => <i key={i} style={{ height: `${20 + ((i * 17) % 58)}%` }} />)}</div><div className="tts-controls"><span className="play-orb" aria-hidden="true">▶</span><div><strong>Capability showcase</strong><p>This page intentionally presents the concept without claiming a live synthesis backend.</p></div><span className="lab-badge">EXPLORATION</span></div></div><p className="fine-print">The original portfolio used this space to explore AI-assisted audio. It remains a lab for interaction design, product thinking, and future experiments.</p></section>;
}
