"use client";

import { StatusScreen } from "@/components/status-screen";

export default function LoginError() {
  return (
    <main className="flex flex-1 flex-col">
      <StatusScreen
        role="alert"
        eyebrow="Sign in"
        title="Sign-in is unavailable"
        description="The server's sign-in settings look wrong. It's been logged."
      />
    </main>
  );
}
