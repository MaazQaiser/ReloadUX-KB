import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DetailSection } from "@/components/project-detail/section";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getIntegrations } from "@/env";
import { requireRole } from "@/server/auth";

export const metadata: Metadata = { title: "admin chat" };

const EXAMPLES = [
  "We just delivered a fintech onboarding web app for Fintua, Sara led it.",
  "Change the Ledgerly delivery date to 12 March 2026.",
  "Add Hamza as a designer on Postwise.",
];

const STEPS = [
  ["Describe it", "Type what happened in plain words, the way you'd tell a colleague."],
  ["Fill the gaps", "Claude drafts the record and asks only for missing required fields: delivery date, product type, Figma link."],
  ["Check the preview", "A card shows every field of the draft, or a before and after for edits. Correct anything wrong."],
  ["Approve", "On approval it saves exactly like the project form, with the same checks."],
] as const;

export default function AdminChatPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Editors"
        title="Admin chat"
        description="Add or update projects by describing them. Nothing saves until you've seen the preview and approved it."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <AdminChatView />
      </Suspense>
    </div>
  );
}

async function AdminChatView() {
  await requireRole("editor");
  const { anthropic } = getIntegrations();

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <div role="status" className="flex flex-col items-start gap-3 border border-dashed p-6">
          <h2 className="text-2xl">Admin chat isn&apos;t connected yet</h2>
          <p className="text-soft-foreground">
            {anthropic
              ? "The Anthropic key is set; the intake agent is the next piece to switch on."
              : "It needs the Anthropic API key in the server environment."}{" "}
            Until then, add and edit projects with the form.
          </p>
          <Link href="/projects/new" className={buttonVariants()}>
            Add a project with the form
          </Link>
        </div>

        <div className="flex flex-col gap-2 opacity-60">
          <Label htmlFor="admin-chat-message">Message</Label>
          <Textarea
            id="admin-chat-message"
            rows={4}
            disabled
            placeholder="We just delivered a fintech onboarding web app for Fintua, Sara led it."
          />
        </div>

        <DetailSection title="Things you'll be able to say">
          <ul className="flex flex-col border-t">
            {EXAMPLES.map((example) => (
              <li key={example} className="border-b py-3 font-heading text-lg">
                “{example}”
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>

      <DetailSection title="How it works">
        <ol className="flex flex-col gap-5">
          {STEPS.map(([title, text], index) => (
            <li key={title} className="flex gap-4">
              <span className="font-heading text-2xl text-muted-foreground">{index + 1}</span>
              <div className="flex flex-col gap-1">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-soft-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </DetailSection>
    </div>
  );
}
