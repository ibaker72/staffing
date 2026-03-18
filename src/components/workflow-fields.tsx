"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface WorkflowFieldsProps {
  entityId: string;
  assignedTo: string | null;
  nextAction: string | null;
  dueDate: string | null;
  onSave: (entityId: string, assignedTo: string | null, nextAction: string | null, dueDate: string | null) => Promise<void>;
}

export function WorkflowFields({ entityId, assignedTo, nextAction, dueDate, onSave }: WorkflowFieldsProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await onSave(
        entityId,
        (formData.get("assigned_to") as string) || null,
        (formData.get("next_action") as string) || null,
        (formData.get("due_date") as string) || null,
      );
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">Assigned To</label>
        <input
          type="text"
          name="assigned_to"
          defaultValue={assignedTo ?? ""}
          placeholder="Recruiter name"
          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">Next Action</label>
        <input
          type="text"
          name="next_action"
          defaultValue={nextAction ?? ""}
          placeholder="e.g. Schedule interview"
          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">Due Date</label>
        <input
          type="date"
          name="due_date"
          defaultValue={dueDate ?? ""}
          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <Button type="submit" variant="secondary" className="text-xs w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Save Workflow"}
      </Button>
    </form>
  );
}
