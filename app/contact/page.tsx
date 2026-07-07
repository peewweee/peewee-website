import type { Metadata } from "next";
import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin, FaFacebook, FaEnvelope } from "react-icons/fa6";

import { siteConfig } from "@/lib/site";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";

const SOCIAL_ICONS: Record<string, IconType> = {
  LinkedIn: FaLinkedin,
  GitHub: FaGithub,
  Email: FaEnvelope,
  Facebook: FaFacebook,
};

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send an owl to Phoebe Rhone Gangoso — hiring, collaboration, or curiosity.",
};

export default function ContactPage() {
  return (
    <div className="container py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <PageHeader
            eyebrow="The Owl Post"
            title="Send an owl"
            lede="Wanna collaborate or just curious? Drop a note!"
          />
          <div className="mt-6 space-y-3 text-sm text-foreground-muted">
            <p>
              I&rsquo;m focused on{" "}
              <strong className="text-foreground">Software & AI Engineering</strong> roles. If
              that&rsquo;s you, the resume and projects are one click away — and the
              Sorting Hat can answer specifics about my work.
            </p>
            <p>
              You can also find me via the links below.
            </p>
            <ul className="flex flex-wrap items-center gap-3 pt-1">
              {siteConfig.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.label] ?? FaEnvelope;
                const external = s.href.startsWith("http");
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      aria-label={s.label}
                      title={s.label}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="flex size-10 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-accent hover:text-accent-text focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <Icon className="size-[18px]" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* The owl-post form is its own card (from the design system). */}
        <ContactForm />
      </div>
    </div>
  );
}
