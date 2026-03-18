export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-zinc-200" />
        <div className="h-4 w-56 rounded bg-zinc-100" />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3 last:border-b-0"
          >
            <div className="h-4 w-48 rounded bg-zinc-200" />
            <div className="h-4 w-32 rounded bg-zinc-100" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="ml-auto h-4 w-20 rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
