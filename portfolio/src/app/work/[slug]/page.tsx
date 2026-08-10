import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projectBySlug, projects } from "@/data/projects";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug[slug];
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = projectBySlug[slug];
  if (!project) notFound();
  return <article className={`project-detail page-shell accent-${project.accent}`}>
    <Link className="back-link" href="/#work">← Back to selected work</Link>
    <div className="detail-hero"><p className="eyebrow">{project.kicker}</p><h1>{project.title}</h1><p className="detail-summary">{project.summary}</p><div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
    <div className="detail-layout"><div className="detail-art" aria-hidden="true"><span>{project.title.split(" ").map((word) => word[0]).join("").slice(0, 3)}</span></div><div className="detail-content"><p className="detail-description">{project.description}</p><div className="detail-facts">{project.details.map((detail) => <div key={detail.label}><span>{detail.label}</span><strong>{detail.value}</strong></div>)}</div>{project.links?.map((link) => <a className="button button-primary" href={link.href} target="_blank" rel="noreferrer" key={link.href}>{link.label} <span aria-hidden="true">↗</span></a>)}</div></div>
  </article>;
}
