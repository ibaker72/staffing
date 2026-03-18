export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-7 w-32 bg-zinc-200 rounded" />
        <div className="h-4 w-56 bg-zinc-100 rounded mt-2" />
      </div>

      {/* KPI row skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="h-3 w-24 bg-zinc-100 rounded" />
            <div className="h-8 w-16 bg-zinc-200 rounded mt-3" />
          </div>
        ))}
      </div>

      {/* Secondary row skeleton */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="h-3 w-28 bg-zinc-100 rounded" />
            <div className="h-8 w-12 bg-zinc-200 rounded mt-3" />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="h-4 w-32 bg-zinc-200 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-3 bg-zinc-100 rounded w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
