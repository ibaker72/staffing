"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types/database";

const priorityColors: Record<string, string> = {
  low: "text-zinc-400",
  medium: "text-amber-500",
  high: "text-red-500",
  urgent: "text-red-700",
};

export function TaskPanel({
  tasks,
  entityType,
  entityId,
  onComplete,
  onCreate,
}: {
  tasks: Task[];
  entityType?: string;
  entityId?: string;
  onComplete: (id: string) => Promise<void>;
  onCreate: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      {tasks.length > 0 && (
        <div className="divide-y divide-zinc-100">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onComplete={onComplete} />
          ))}
        </div>
      )}
      <InlineTaskForm entityType={entityType} entityId={entityId} onCreate={onCreate} />
    </div>
  );
}

function TaskRow({
  task,
  onComplete,
}: {
  task: Task;
  onComplete: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <div className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
      <button
        onClick={() => startTransition(() => onComplete(task.id))}
        disabled={isPending}
        className="mt-0.5 h-4 w-4 rounded border border-zinc-300 hover:border-zinc-500 shrink-0 flex items-center justify-center"
        title="Complete task"
      >
        {isPending && <span className="block h-2 w-2 rounded-full bg-zinc-400" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-900">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-medium uppercase ${priorityColors[task.priority] ?? "text-zinc-400"}`}>
            {task.priority}
          </span>
          {task.due_date && (
            <span className={`text-[10px] ${isOverdue ? "text-red-600 font-medium" : "text-zinc-400"}`}>
              Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function InlineTaskForm({
  entityType,
  entityId,
  onCreate,
}: {
  entityType?: string;
  entityId?: string;
  onCreate: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await onCreate(formData);
    });
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      {entityType && <input type="hidden" name="entity_type" value={entityType} />}
      {entityId && <input type="hidden" name="entity_id" value={entityId} />}
      <input
        type="text"
        name="title"
        required
        placeholder="Add a task…"
        className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
      <input
        type="date"
        name="due_date"
        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
      <Button type="submit" variant="secondary" className="text-xs" disabled={isPending}>
        Add
      </Button>
    </form>
  );
}
