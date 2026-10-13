/**
 * The right half of the login screen. An abstract placeholder in the
 * reloadux palette until a team or work photo replaces it; drawn in code so
 * it needs no public asset (the proxy only lets signed-out visitors reach
 * a few paths).
 */
export function LoginShowcase() {
  return (
    <div aria-hidden className="relative hidden overflow-hidden border-l bg-rx-night lg:block">
      {/* Hairline grid, like the tile borders on reloadux.com. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
      <div className="absolute top-1/2 left-1/2 size-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--rx-purple)_45%,transparent),transparent_65%)] blur-2xl" />

      <svg viewBox="0 0 600 600" className="absolute top-1/2 left-1/2 w-[min(80%,640px)] -translate-x-1/2 -translate-y-1/2">
        <g fill="none" stroke="currentColor" className="text-muted-foreground">
          {[280, 220, 160, 100].map((r, index) => (
            <circle key={r} cx="300" cy="300" r={r} strokeOpacity={0.15 + index * 0.12} strokeWidth="1" />
          ))}
          <path d="M20 300 H580 M300 20 V580" strokeOpacity="0.12" strokeDasharray="2 6" />
          <path d="M100 300 A200 200 0 0 1 500 300" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" />
        </g>
        <g fill="white">
          <circle cx="100" cy="300" r="5" />
          <circle cx="300" cy="100" r="3" fillOpacity="0.6" />
          <circle cx="441" cy="159" r="4" fillOpacity="0.8" />
          <circle cx="300" cy="300" r="10" />
        </g>
      </svg>

      <p className="absolute right-12 bottom-12 left-12 max-w-sm text-sm text-muted-foreground">
        Projects, people, screens and links from every reloadux engagement, in one place.
      </p>
    </div>
  );
}
