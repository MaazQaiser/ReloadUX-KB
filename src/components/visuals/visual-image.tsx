import Image from "next/image";

/** Screenshots come from our auth-checked file route, so Next's optimiser (which fetches anonymously) is skipped. */
export function VisualImage({ url, alt, sizes }: { url: string; alt: string; sizes: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted shadow-pulse-soft">
      <Image src={url} alt={alt} fill sizes={sizes} unoptimized className="object-cover object-top" />
    </div>
  );
}
