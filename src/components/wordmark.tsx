import Link from "next/link";

export function Wordmark() {
  return (
    <Link
      href="/"
      className="text-2xl font-light tracking-tight lowercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      reload<span className="font-bold">ux</span>
    </Link>
  );
}
