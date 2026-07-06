import type { Metadata } from "next";

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
