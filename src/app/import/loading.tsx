export default function ImportLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-zinc-200 rounded animate-pulse" />
      </div>

      {/* Steps indicator skeleton */}
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-zinc-200 animate-pulse" />
            <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse hidden sm:block" />
          </div>
        ))}
      </div>

      {/* Card skeleton */}
      <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-40 bg-zinc-200 rounded animate-pulse" />
        <div className="space-y-3">
          <div className="h-10 w-full bg-zinc-200 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-zinc-200 rounded-lg animate-pulse" />
          <div className="h-10 w-2/3 bg-zinc-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
