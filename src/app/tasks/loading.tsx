export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-zinc-200" />
        <div className="h-4 w-56 rounded bg-zinc-100" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3"
          >
            <div className="h-4 w-4 rounded bg-zinc-200" />
            <div className="h-4 w-64 rounded bg-zinc-200" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="ml-auto h-4 w-20 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
