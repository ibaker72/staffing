import type { ActivityEvent } from "@/types/database";

const eventIcons: Record<string, string> = {
  status_change: "~",
  created: "+",
  resume_upload: "^",
  note_added: "#",
  outreach_update: "@",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-zinc-500">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="flex gap-3 text-sm">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs text-zinc-500 font-mono">
            {eventIcons[event.event_type] ?? "."}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-zinc-700">{event.description}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(event.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CompactActivityList({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-zinc-500">No recent activity.</p>;
  }

  return (
    <div className="divide-y divide-zinc-100">
      {events.map((event) => (
        <div key={event.id} className="py-2.5 first:pt-0 last:pb-0">
          <p className="text-sm text-zinc-700 truncate">{event.description}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(event.created_at)}</p>
        </div>
      ))}
    </div>
  );
}
