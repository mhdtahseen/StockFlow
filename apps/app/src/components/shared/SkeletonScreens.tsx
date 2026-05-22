import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="md:max-w-5xl md:mx-auto">
        {/* Hero card */}
        <section className="pt-4 pb-2">
          <Skeleton className="h-28 w-full rounded-xl" />
        </section>

        {/* Capital Allocation grid */}
        <section className="py-4">
          <Skeleton className="h-3 w-32 mb-3 ml-1" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </section>

        {/* Recent phones */}
        <section className="py-2">
          <Skeleton className="h-3 w-28 mb-3 ml-1" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
}

export function InventorySkeleton() {
  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-[1rem]" />
        <Skeleton className="h-20 rounded-[1rem]" />
      </div>

      {/* Group header */}
      <Skeleton className="h-3 w-24" />

      {/* Phone cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-4 rounded-[1rem] border border-slate-100 dark:border-slate-800 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
