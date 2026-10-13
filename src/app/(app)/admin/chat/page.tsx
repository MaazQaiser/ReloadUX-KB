import { redirect } from "next/navigation";

// Admin chat isn't part of the app for now; old links and bookmarks land on Home.
export default function AdminChatPage() {
  redirect("/");
}
