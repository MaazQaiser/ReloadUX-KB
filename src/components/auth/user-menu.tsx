import { USER_ROLE } from "@/lib/constants";
import { getSessionUser } from "@/server/auth";
import { UserMenuDropdown } from "./user-menu-dropdown";

export async function UserMenu() {
  const user = await getSessionUser();
  if (!user) return null;
  return (
    <UserMenuDropdown
      user={{
        name: user.name,
        email: user.email,
        photoUrl: user.photo_url,
        subtitle: user.designation ?? USER_ROLE.labels[user.role],
      }}
    />
  );
}
