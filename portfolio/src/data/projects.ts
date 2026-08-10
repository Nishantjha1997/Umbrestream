export type Project = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  description: string;
  tags: string[];
  accent: string;
  metric: string;
  links?: { label: string; href: string }[];
  details: { label: string; value: string }[];
};

export const projects: Project[] = [
  {
    slug: "flowcreate",
    title: "FlowCreate",
    kicker: "AI resume builder",
    summary: "A guided, ATS-aware workspace that turns career information into polished, export-ready resumes.",
    description: "FlowCreate combines structured prompts, reusable layouts, live preview, and export workflows into one focused experience. It is designed to remove the blank-page problem while keeping the user in control of the final story.",
    tags: ["Product design", "AI workflows", "Next.js", "UX systems"],
    accent: "coral",
    metric: "30+ templates",
    links: [{ label: "Open live project", href: "https://flowcreate-similar-dream.vercel.app/" }],
    details: [
      { label: "Role", value: "Product owner and builder" },
      { label: "Focus", value: "Guided creation, preview, export" },
      { label: "Outcome", value: "A faster path from raw experience to a strong first draft" },
    ],
  },
  {
    slug: "streamfree",
    title: "StreamFree",
    kicker: "Media discovery platform",
    summary: "A responsive movie, television, and anime discovery experience with resilient player orchestration.",
    description: "StreamFree brings catalog discovery, title detail views, watch history, mobile-first player controls, and provider-aware source selection into a single product. The work emphasizes fast first render, accessible controls, and graceful recovery when a source is unavailable.",
    tags: ["Full-stack web", "Playback UX", "Mobile", "Vercel"],
    accent: "violet",
    metric: "Live on streamfree.online",
    links: [{ label: "Open live project", href: "https://streamfree.online/" }],
    details: [
      { label: "Role", value: "Product, UX, and engineering" },
      { label: "Focus", value: "Navigation, playback flows, responsive UI" },
      { label: "Outcome", value: "A polished, installable web experience with a branded domain" },
    ],
  },
  {
    slug: "gitlab-access-automation",
    title: "GitLab Access Automation",
    kicker: "Internal operations system",
    summary: "A validation and provisioning workflow that turns repository-access requests into an auditable, mostly automatic process.",
    description: "The system connects request intake with layered employee, project, identity, and repository checks before granting or escalating access. It includes scheduled processing, retry logic, audit trails, expiry handling, maintainer approval flows, and operational documentation.",
    tags: ["Google Apps Script", "API integrations", "Process design", "Automation"],
    accent: "amber",
    metric: "Up to 24h → max 30m",
    details: [
      { label: "Role", value: "End-to-end system owner" },
      { label: "Checks", value: "HR, project assignment, identity, permissions" },
      { label: "Impact", value: "Reduced normal eligible-request turnaround from up to 24 hours to a maximum 30-minute processing window" },
    ],
  },
  {
    slug: "claude-usage-uploader",
    title: "Claude Usage Uploader",
    kicker: "Cross-platform telemetry utility",
    summary: "A zero-dependency desktop utility that collects usage telemetry and reliably syncs it for team visibility.",
    description: "Built as a cross-platform Node.js service for Windows, macOS, and Linux, the uploader uses an offline-first outbox, retry backoff, idempotent sync, signed webhooks, and a lightweight administrative dashboard. The public releases project focuses on reliable handover, recovery, and transparent distribution.",
    tags: ["Node.js", "Desktop tooling", "Reliability", "Release engineering"],
    accent: "blue",
    metric: "Windows · macOS · Linux",
    links: [{ label: "View public releases", href: "https://github.com/Nishantjha1997/claude-uploader-releases" }],
    details: [
      { label: "Role", value: "Architecture, implementation, and release workflow" },
      { label: "Focus", value: "Offline durability, secure sync, operations" },
      { label: "Outcome", value: "Portable binaries with checksums, recovery tooling, and update handover" },
    ],
  },
  {
    slug: "my-fitness-blueprint",
    title: "My Fitness Blueprint",
    kicker: "AI-driven web application",
    summary: "A personal fitness-planning workspace for goals, workouts, progress, and data-informed adjustments.",
    description: "This end-to-end web application explores how a focused product can turn goals into an actionable routine. It combines planning, tracking, and progress views in a practical interface built around consistent follow-through.",
    tags: ["Web application", "Tracking", "Product thinking", "AI-assisted build"],
    accent: "green",
    metric: "Live prototype",
    links: [{ label: "Open live project", href: "https://myfittracker.netlify.app/" }],
    details: [
      { label: "Role", value: "Product, design, and implementation" },
      { label: "Focus", value: "Goals, routines, tracking, progress" },
      { label: "Outcome", value: "A usable blueprint for consistent personal progress" },
    ],
  },
];

export const projectBySlug = Object.fromEntries(projects.map((project) => [project.slug, project])) as Record<string, Project>;
