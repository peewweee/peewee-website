"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

type Role = { title: string; dates: string; bullets: string[] };
type Company = { company: string; logo: string; roles: Role[] };
type Leadership = {
  org: string;
  logo: string;
  role: string;
  dates: string;
  bullets: string[];
};

const WORK: Company[] = [
  {
    company: "SOFI AI Tech Solution Inc.",
    logo: "/logos/sofi.png",
    roles: [
      {
        title: "Junior AI Engineer (Contract)",
        dates: "January 2026 – March 2026",
        bullets: [
          "Optimized and managed stability for 10+ live client chatbots by rapidly diagnosing production-level defects and maintaining AI workflows",
          "Developed a document ingestion system using Python and FAISS to perform vector-based similarity searches",
          "Refined RAG pipelines for document-based knowledge training to provide accurate automated responses",
        ],
      },
      {
        title: "Developer Intern",
        dates: "July 2025 – December 2025",
        bullets: [
          "Automated and successfully launched a client-facing AI conversational agent into live production using visual workflow builders and advanced prompt engineering",
          "Built integrations with Google Sheets using Google Apps Script for automated and efficient data collection",
          "Leveraged REST APIs to enhance chatbot functionalities and streamline processes",
        ],
      },
    ],
  },
  {
    company: "Dewise Solutions Philippines Inc.",
    logo: "/logos/dewise.png",
    roles: [
      {
        title: "Software Engineer Intern",
        dates: "August 2024 – October 2024",
        bullets: [
          "Completed over 10 Microsoft Learning paths focused on DevOps, Python, Azure services, Cloud, AI, GitHub, and Copilot",
          "Developed the frontend of a Progressive Web App using Next.js and TypeScript",
          "Designed UI/UX flows through wireframing, high-fidelity prototyping, user research, and design thinking",
        ],
      },
    ],
  },
];

const LEADERSHIP: Leadership[] = [
  {
    org: "Google Developer Groups on Campus PUP",
    logo: "/logos/gdg.png",
    role: "UI/UX Lead",
    dates: "September 2024 – September 2025",
    bullets: [
      "Led a team of 180+ members with a 12-member support committee to execute 5 workshops and study jams, including a 200+ participant inaugural session",
      "Delivered sessions on design fundamentals and Figma while overseeing end-to-end event planning and coordination",
    ],
  },
  {
    org: "PUP Manila Microsoft Student Community",
    logo: "/logos/mssc.png",
    role: "Associate Director of the Developer + Operations (DevOps) Division",
    dates: "September 2024 – September 2025",
    bullets: [
      "Conducted study sessions focused on DevOps and key concepts such as CI/CD pipelines, deployment strategies, and the use of various DevOps tools and services within Microsoft Azure",
    ],
  },
  {
    org: "Arduino Day Philippines 2025",
    logo: "/logos/arduino-day.png",
    role: "Website Team UI/UX Lead",
    dates: "January 2025 – March 2025",
    bullets: [
      "Led a team of UI/UX design volunteers in creating the UI design for the Arduino Day Philippines 2025 website",
    ],
  },
  {
    org: "PUP The Programmers' Guild",
    logo: "/logos/tpg.png",
    role: "Devskolar & Media Committee",
    dates: "April 2023 – January 2025",
    bullets: [
      "Volunteered and created design materials for marketing, social media postings, and events",
    ],
  },
];

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.15em] text-foreground-muted">
      {children}
    </h3>
  );
}

/** Company/org logo from /logos; hides itself gracefully until the file exists. */
function Logo({ src, size = 28 }: { src: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className="shrink-0 rounded-md bg-surface object-contain p-1 ring-1 ring-border"
      style={{ width: size, height: size }}
    />
  );
}

function RoleBlock({ role }: { role: Role }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-sm font-semibold text-foreground">{role.title}</p>
        <p className="shrink-0 font-mono text-xs text-foreground-faint">{role.dates}</p>
      </div>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground-muted marker:text-accent-text">
        {role.bullets.map((b, j) => (
          <li key={j}>{b}</li>
        ))}
      </ul>
    </>
  );
}

export function Experience() {
  const railRef = React.useRef<HTMLOListElement>(null);
  const stopNodeRef = React.useRef<HTMLSpanElement>(null);
  // The beam should travel only as far as the second node, not the whole rail.
  // Measure that node's centre as a fraction of the rail height and cap the fill.
  const [stopFrac, setStopFrac] = React.useState(1);

  React.useEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      const node = stopNodeRef.current;
      if (!rail || !node) return;
      const railRect = rail.getBoundingClientRect();
      if (railRect.height <= 0) return;
      const nodeRect = node.getBoundingClientRect();
      const y = nodeRect.top + nodeRect.height / 2 - railRect.top;
      setStopFrac(Math.min(1, Math.max(0.02, y / railRect.height)));
    };
    measure();
    const t = window.setTimeout(measure, 300); // re-measure after fonts/logos settle
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Beam fills the rail as this timeline scrolls through the viewport centre, so
  // its bright leading edge tracks the node you're currently on — but it stops at
  // the second node (clamped past `stopFrac`).
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start center", "end center"],
  });
  const beamHeight = useTransform(
    scrollYProgress,
    [0, stopFrac],
    ["0%", `${stopFrac * 90}%`],
  );

  return (
    <section aria-labelledby="experience-heading">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
        The Chronicle
      </p>
      <h2 id="experience-heading" className="mt-2 font-display text-3xl font-bold">
        Experiences
      </h2>

      {/* Work experience — timeline with a faded rail + a scroll-tracking beam */}
      <div className="mt-8">
        <SubHeading>Work Experience</SubHeading>
        <ol ref={railRef} className="relative mt-5 space-y-8 pl-6">
          {/* faded base line */}
          <span className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-border to-transparent" />
          {/* beam: bright fill from the top down to the current scroll position */}
          <motion.span
            style={{ height: beamHeight }}
            className="pointer-events-none absolute left-0 top-0 w-px bg-gradient-to-b from-transparent via-accent to-accent-text"
          />

          {WORK.map((c, i) => (
            <li key={i} className="relative">
              <span
                ref={i === 1 ? stopNodeRef : null}
                className="absolute -left-6 top-2.5 size-3 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(var(--accent-glow),0.65)]"
              />
              <div className="flex items-center gap-2.5">
                <Logo src={c.logo} />
                <p className="text-base font-semibold text-accent-text">{c.company}</p>
              </div>

              {c.roles.length > 1 ? (
                <ol className="relative mt-3 space-y-4 pl-5">
                  {/* mini rail — starts at the first node (no stub above), faded at its end */}
                  <span className="pointer-events-none absolute bottom-0 left-0 top-2.5 w-px bg-gradient-to-b from-border via-border to-transparent" />
                  {c.roles.map((role, j) => (
                    <li key={j} className="relative">
                      <span className="absolute -left-5 top-1.5 size-2 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_7px_1px_rgba(var(--accent-glow),0.65)]" />
                      <RoleBlock role={role} />
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-2">
                  <RoleBlock role={c.roles[0]} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Leadership experience — line-separated rows, org first, with logos */}
      <div className="mt-10">
        <SubHeading>Leadership Experience</SubHeading>
        <div className="mt-4 divide-y divide-border">
          {LEADERSHIP.map((l, i) => (
            <div key={i} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
              <Logo src={l.logo} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold text-accent-text">{l.org}</p>
                  <p className="shrink-0 font-mono text-xs text-foreground-faint">
                    {l.dates}
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-foreground-muted">{l.role}</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground-muted marker:text-accent-text">
                  {l.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
