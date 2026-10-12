import Link from "next/link";

export function Wordmark() {
  return (
    <Link
      href="/"
      className="text-2xl font-bold tracking-tight lowercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      reloadux
    </Link>
  );
}
