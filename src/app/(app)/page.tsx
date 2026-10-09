import { redirect } from "next/navigation";

// The Ask screen becomes home in phase 3; until then, start on Projects.
export default function Home() {
  redirect("/projects");
}
