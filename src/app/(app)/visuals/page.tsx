import { redirect } from "next/navigation";

// Visuals moved into Projects; old links and bookmarks land there.
export default function VisualsPage() {
  redirect("/projects/visuals");
}
