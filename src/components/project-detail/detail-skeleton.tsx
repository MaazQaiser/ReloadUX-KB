import { Skeleton } from "@/components/ui/skeleton";

export function DetailSkeleton() {
  return (
    <div
      className="flex flex-col gap-10 border border-pulse-rule px-6 py-8 sm:px-12 sm:py-12"
      aria-busy="true"
      aria-label="Loading project"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-40 rounded-none" />
        <Skeleton className="h-12 w-72 rounded-none" />
        <Skeleton className="h-4 w-48 rounded-none" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="h-96 rounded-none" />
        <Skeleton className="h-96 rounded-none" />
      </div>
    </div>
  );
}
