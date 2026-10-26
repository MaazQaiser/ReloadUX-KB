import Link from "next/link";
import { DetailSection } from "@/components/project-detail/section";
import { Badge } from "@/components/ui/badge";
import type { Integrations } from "@/env";
import { TAG_LIST_NAMES, TAG_LIST_TITLES } from "@/lib/constants";
import { tagLabel, type TagCatalog } from "@/lib/tag-catalog";
import { formatDate } from "@/lib/format";
import type { User } from "@/schemas/user";
import type { AskStats } from "@/server/repositories/conversations";
import type { LibraryHealth } from "@/server/services/analytics";
import { AddTagForm } from "./add-tag-form";
import { ApproveForm } from "./approve-form";
import { RoleForm } from "./role-form";

export function UsersSection({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const waiting = users.filter((user) => user.role === "pending").length;
  return (
    <DetailSection title="People and access">
      <p className="text-sm text-soft-foreground">
        {waiting > 0
          ? `${waiting} ${waiting === 1 ? "person is" : "people are"} waiting for approval.`
          : "Nobody is waiting for approval."}{" "}
        Pending people can sign in but see nothing. Set someone back to pending to revoke their access.
      </p>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-pulse-soft">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b text-left text-xs tracking-wide text-pulse-muted uppercase">
            <tr>
              <th scope="col" className="p-4 font-medium">Person</th>
              <th scope="col" className="p-4 font-medium">Last signed in</th>
              <th scope="col" className="p-4 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-b-0 align-top">
                <td className="p-4">
                  <p className="text-foreground">{user.name}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </td>
                <td className="p-4 text-soft-foreground">{formatDate(user.last_sign_in_at)}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-3">
                    {user.role === "pending" && <ApproveForm userId={user.id} name={user.name} />}
                    <RoleForm userId={user.id} name={user.name} role={user.role} isSelf={user.id === currentUserId} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DetailSection>
  );
}

const SERVICES: { key: keyof Integrations; name: string; unlocks: string }[] = [
  { key: "anthropic", name: "Anthropic (Claude)", unlocks: "Ask agent, admin chat, Fill from text, screenshot captions" },
  { key: "voyage", name: "Voyage AI", unlocks: "Embeddings and reranking for smarter search" },
  { key: "r2", name: "Cloudflare R2", unlocks: "Screenshot uploads and the visual library" },
];

export function IntegrationsSection({ integrations }: { integrations: Integrations }) {
  return (
    <DetailSection title="Connected services">
      <ul className="grid border-t border-l sm:grid-cols-3">
        {SERVICES.map((service) => (
          <li key={service.key} className="flex flex-col gap-2 border-r border-b p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{service.name}</p>
              <Badge variant={integrations[service.key] ? "default" : "outline"}>
                {integrations[service.key] ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{service.unlocks}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Keys go in the server environment; see .env.example for the names.</p>
    </DetailSection>
  );
}

export function LibraryHealthSection({ health, ask }: { health: LibraryHealth; ask: AskStats }) {
  const thisWeek = ask.weekly.at(-1)?.count ?? 0;
  const peak = Math.max(1, ...ask.weekly.map((week) => week.count));
  const thumbsRate = ask.ratedAnswers > 0 ? `${Math.round((ask.thumbsUp / ask.ratedAnswers) * 100)}%` : "—";
  return (
    <DetailSection title="Analytics">
      <dl className="grid border-t border-l sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Projects", String(health.projectCount)],
          ["Average completeness", `${health.averageScore}%`],
          ["Questions, last 8 weeks", String(ask.totalQuestions)],
          ["Thumbs-up rate", thumbsRate],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 border-r border-b p-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-heading text-4xl font-bold tracking-[-0.02em] tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {ask.weekly.length > 0 ? (
        <figure className="flex flex-col gap-2">
          <figcaption className="text-sm text-muted-foreground">Questions per week ({thisWeek} this week)</figcaption>
          <ol className="flex h-32 items-end gap-2 border-b">
            {ask.weekly.map((week) => (
              <li key={week.week.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-soft-foreground">{week.count}</span>
                <span className="w-full max-w-10 rounded-t-md bg-foreground" style={{ height: `${(week.count / peak) * 96}px` }} aria-hidden />
                <span className="sr-only">
                  Week of {formatDate(week.week)}: {week.count} questions
                </span>
              </li>
            ))}
          </ol>
        </figure>
      ) : (
        <p className="text-sm text-muted-foreground">No questions asked yet.</p>
      )}
      <p className="text-sm text-muted-foreground">
        The thumbs-up rate counts real agent answers only, not preview answers. Top unanswered topics are in the review
        queue.
      </p>
      <h3 className="mt-2 text-lg">Least complete projects</h3>
      {health.leastComplete.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <ol className="flex flex-col border-t">
          {health.leastComplete.map(({ project, completeness }) => (
            <li key={project.id} className="flex items-center justify-between gap-4 border-b py-3">
              <Link href={`/projects/${project.slug}/edit`} className="underline-offset-4 hover:underline">
                {project.name}
              </Link>
              <span className="text-sm text-muted-foreground">
                {completeness.score}% · {completeness.missing.length} fields missing
              </span>
            </li>
          ))}
        </ol>
      )}
    </DetailSection>
  );
}

export function TagListsSection({ catalog }: { catalog: TagCatalog }) {
  return (
    <DetailSection title="Tag lists">
      <p className="text-sm text-soft-foreground">
        The controlled values every project uses. Add a value when a real project needs it; it appears in the form,
        filters and search straight away. Values can&apos;t be renamed or removed here, because projects already use
        them. Status and roles are fixed.
      </p>
      <dl className="flex flex-col">
        {TAG_LIST_NAMES.map((name) => {
          const list = catalog[name];
          return (
            <div key={name} className="grid gap-3 border-t py-5 sm:grid-cols-[10rem_1fr]">
              <dt className="text-sm text-muted-foreground">{TAG_LIST_TITLES[name]}</dt>
              <dd className="flex flex-col gap-3">
                <ul className="flex flex-wrap gap-1">
                  {list.keys.map((key) => (
                    <li key={key}>
                      <Badge variant={list.added.includes(key) ? "default" : "outline"}>
                        {tagLabel(list, key)}
                        {list.added.includes(key) && <span className="sr-only"> (added)</span>}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <AddTagForm list={name} title={TAG_LIST_TITLES[name]} />
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="text-xs text-muted-foreground">Solid badges are values added here; outlined ones are built in.</p>
    </DetailSection>
  );
}

export function EvalSection() {
  return (
    <DetailSection title="Evaluation">
      <p className="text-sm text-soft-foreground">
        No eval runs yet. Once the agent is connected, the 50-question eval set reports top-3 project accuracy, verdict
        accuracy and invented facts here after every change to prompts, tags or search.
      </p>
    </DetailSection>
  );
}
