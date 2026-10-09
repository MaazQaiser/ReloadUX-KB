import Link from "next/link";

export function Wordmark() {
  return (
    <Link
      href="/"
      className="text-lg font-semibold tracking-tight lowercase focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
    >
      reloadux
    </Link>
  );
}
