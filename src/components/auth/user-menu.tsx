import { USER_ROLE } from "@/lib/constants";
import { getSessionUser } from "@/server/auth";

export async function UserMenu() {
  const user = await getSessionUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-muted-foreground sm:inline">
        {user.name} · {USER_ROLE.labels[user.role]}
      </span>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </form>
    </div>
  );
}
