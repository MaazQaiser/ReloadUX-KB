import Link from "next/link";

/** Pulse's typographic logo: "reload" regular, "ux" bold, never an image. */
export function Wordmark() {
  return (
    <Link
      href="/"
      className="rounded-full text-lg tracking-tight lowercase outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
    >
      reload<span className="font-bold">ux</span>
    </Link>
  );
}
