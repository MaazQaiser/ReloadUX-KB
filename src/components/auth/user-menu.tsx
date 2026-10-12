import { buttonVariants } from "@/components/ui/button";
import { USER_ROLE } from "@/lib/constants";
import { getSessionUser } from "@/server/auth";

export async function UserMenu() {
  const user = await getSessionUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="hidden text-soft-foreground sm:inline">
        {user.name} · {USER_ROLE.labels[user.role]}
      </span>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Sign out
        </button>
      </form>
    </div>
  );
}
