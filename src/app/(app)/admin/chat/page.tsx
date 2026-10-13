import { redirect } from "next/navigation";

// Admin chat moved into Home as an editor mode; old links and bookmarks land there.
export default function AdminChatPage() {
  redirect("/?mode=add");
}
