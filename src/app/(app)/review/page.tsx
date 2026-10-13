import { redirect } from "next/navigation";

// The review queue moved into Projects; old links and bookmarks land there.
export default function ReviewPage() {
  redirect("/projects/review");
}
