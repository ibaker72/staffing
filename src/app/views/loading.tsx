export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-zinc-200" />
        <div className="h-4 w-64 rounded bg-zinc-100" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-lg bg-zinc-200" />
        ))}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex gap-4 border-b border-zinc-100 pb-3">
          <div className="h-4 w-32 rounded bg-zinc-200" />
          <div className="h-4 w-20 rounded bg-zinc-200" />
          <div className="h-4 w-24 rounded bg-zinc-200" />
          <div className="h-4 w-28 rounded bg-zinc-200" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2">
            <div className="h-4 w-48 rounded bg-zinc-100" />
            <div className="h-4 w-16 rounded bg-zinc-100" />
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
