import Link from "next/link";
import { DetailSection } from "@/components/project-detail/section";
import { Badge } from "@/components/ui/badge";
import type { Integrations } from "@/env";
import { AI_FEATURE, FLOW, INDUSTRY, PRODUCT_TYPE, PROJECT_STATUS, SERVICE, type TagList } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { User } from "@/schemas/user";
import type { LibraryHealth } from "@/server/services/analytics";
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
      <div className="overflow-x-auto border">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
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

export function LibraryHealthSection({ health }: { health: LibraryHealth }) {
  return (
    <DetailSection title="Analytics">
      <dl className="grid border-t border-l sm:grid-cols-3">
        {[
          ["Projects", String(health.projectCount)],
          ["Average completeness", `${health.averageScore}%`],
          ["Questions this week", "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 border-r border-b p-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-heading text-4xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        Questions per week, thumbs-up rate and top unanswered topics appear once the Ask agent is connected and
        logging conversations.
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

const TAG_LISTS: [string, TagList<string>][] = [
  ["Industry", INDUSTRY],
  ["Status", PROJECT_STATUS],
  ["Product type", PRODUCT_TYPE],
  ["Services", SERVICE],
  ["AI features", AI_FEATURE],
  ["Flows", FLOW],
];

export function TagListsSection() {
  return (
    <DetailSection title="Tag lists">
      <p className="text-sm text-soft-foreground">
        The controlled values every project uses. Adding values here from the screen comes in a later update; for now
        they change in code (src/lib/constants.ts).
      </p>
      <dl className="flex flex-col gap-4">
        {TAG_LISTS.map(([name, list]) => (
          <div key={name} className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-muted-foreground">{name}</dt>
            <dd className="flex flex-wrap gap-1">
              {list.keys.map((key) => (
                <Badge key={key} variant="outline">
                  {list.labels[key]}
                </Badge>
              ))}
            </dd>
          </div>
        ))}
      </dl>
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
