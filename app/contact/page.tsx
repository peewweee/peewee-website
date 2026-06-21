import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";

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
            lede="Hiring, collaborating, or just curious? Drop a note — I read every owl."
          />
          <div className="mt-6 space-y-3 text-sm text-foreground-muted">
            <p>
              I&rsquo;m focused on{" "}
              <strong className="text-foreground">AI Engineering</strong> roles. If
              that&rsquo;s you, the resume and projects are one click away — and the
              Sorting Hat (bottom-right) can answer specifics about my work.
            </p>
            <p>
              Prefer another route? Find me via the links in the footer
              {siteConfig.socials.length > 0 ? " (GitHub, LinkedIn)." : "."}
            </p>
          </div>
        </div>

        {/* `relative` contains the form's off-screen honeypot field. */}
        <div className="relative rounded-card border border-border bg-surface p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
