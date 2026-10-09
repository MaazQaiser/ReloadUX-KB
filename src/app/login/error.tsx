"use client";

export default function LoginError() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-2 px-4 py-16" role="alert">
      <h1 className="text-xl font-semibold tracking-tight">Sign-in is unavailable</h1>
      <p className="text-muted-foreground">The server&apos;s sign-in settings look wrong. It&apos;s been logged.</p>
    </main>
  );
}
