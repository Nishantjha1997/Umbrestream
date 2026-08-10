import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { Mark } from "@/components/Mark";
import { projects } from "@/data/projects";

export default function HomePage() {
  return (
    <>
      <section className="hero page-shell">
        <div className="hero-orbit" aria-hidden="true"><Mark /></div>
        <p className="eyebrow reveal">Executive operations · AI automation · digital products</p>
        <h1 className="reveal delay-1">I turn ambitious ideas into <em>clear, useful systems.</em></h1>
        <p className="hero-lede reveal delay-2">I&apos;m Nishant Jha, an Executive in the Founder&apos;s Office at CallHippo. I work across leadership, operations, engineering, and delivery to move important work from ambiguity to execution.</p>
        <div className="hero-actions reveal delay-3"><Link className="button button-primary" href="#work">Explore my work <span aria-hidden="true">↓</span></Link><Link className="button button-quiet" href="/contact">Start a conversation <span aria-hidden="true">↗</span></Link></div>
        <div className="hero-foot reveal delay-3"><span>Currently at CallHippo</span><span className="status-dot" /> <span>Ahmedabad, India · available for thoughtful collaborations</span></div>
      </section>

      <section className="section page-shell intro-grid">
        <div><p className="section-index">01 / THE THROUGH-LINE</p><h2>Make the complex <em>move.</em></h2></div>
        <div className="intro-copy"><p>My work sits at the intersection of executive leverage and hands-on building. I translate requirements into operating rhythms, dashboards, automations, and products that make the next decision easier.</p><p>Whether it is a leadership initiative, a cross-functional process, or a product I am building end to end, I care about the details that turn a promising idea into dependable daily use.</p></div>
      </section>

      <section id="work" className="section page-shell work-section">
        <div className="section-heading"><div><p className="section-index">02 / SELECTED WORK</p><h2>Things I&apos;ve <em>built.</em></h2></div><p className="section-note">A mix of operating systems, internal tools, and products designed from the ground up.</p></div>
        <div className="project-grid">{projects.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}</div>
      </section>

      <section className="section page-shell capability-section">
        <p className="section-index">03 / HOW I WORK</p><div className="capability-grid">
          <article><span>01</span><h3>See the system</h3><p>Map the people, decisions, dependencies, and friction before proposing a fix.</p></article>
          <article><span>02</span><h3>Build the bridge</h3><p>Connect tools and teams with automation that is documented, observable, and easy to hand over.</p></article>
          <article><span>03</span><h3>Make it last</h3><p>Measure the outcome, close the loop, and leave behind a process people can trust.</p></article>
        </div>
      </section>

      <section className="closing-cta page-shell"><p className="section-index">04 / NEXT STEP</p><h2>Have a messy problem<br /><em>worth solving?</em></h2><Link className="button button-primary" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></Link></section>
    </>
  );
}
