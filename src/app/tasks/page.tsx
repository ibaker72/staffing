import type { Metadata } from "next";
import { getTasks, createTask, completeTask, reopenTask, deleteTask } from "@/actions/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export const metadata: Metadata = { title: "Tasks" };
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { TaskPriority } from "@/types/database";

export const dynamic = "force-dynamic";

const priorityColors: Record<string, string> = {
  low: "text-zinc-400",
  medium: "text-amber-500",
  high: "text-red-500",
  urgent: "text-red-700 font-bold",
};

const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { show } = await searchParams;
  const showCompleted = show === "completed";

  const tasks = await getTasks({ showCompleted });

  async function handleCreate(formData: FormData) {
    "use server";
    await createTask(formData);
    revalidatePath("/tasks");
  }

  async function handleComplete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await completeTask(id);
    revalidatePath("/tasks");
  }

  async function handleReopen(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await reopenTask(id);
    revalidatePath("/tasks");
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteTask(id);
    revalidatePath("/tasks");
  }

  const today = new Date(new Date().toDateString());

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Internal tasks and reminders"
      />

      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/tasks"
          className={`text-sm font-medium px-3 py-1.5 rounded-lg ${!showCompleted ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Open
        </Link>
        <Link
          href="/tasks?show=completed"
          className={`text-sm font-medium px-3 py-1.5 rounded-lg ${showCompleted ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Completed
        </Link>
      </div>

      {!showCompleted && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Add Task</h3>
          <form action={handleCreate} className="flex flex-wrap gap-3">
            <input
              type="text"
              name="title"
              required
              placeholder="Task title"
              className="flex-1 min-w-[200px] rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <select
              name="priority"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="due_date"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <Button type="submit" className="text-sm">Add Task</Button>
          </form>
        </Card>
      )}

      <Card>
        {tasks.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {showCompleted ? "No completed tasks." : "No open tasks. Create one above!"}
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {tasks.map((task) => {
              const isOverdue = task.due_date && !task.completed_at && new Date(task.due_date) < today;
              return (
                <div key={task.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed_at ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium uppercase ${priorityColors[task.priority] ?? "text-zinc-400"}`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className={`text-[10px] ${isOverdue ? "text-red-600 font-medium" : "text-zinc-400"}`}>
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.entity_type && task.entity_id && (
                        <Link
                          href={`/${task.entity_type === "company" ? "companies" : task.entity_type === "candidate" ? "candidates" : "jobs"}/${task.entity_id}`}
                          className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                        >
                          View {task.entity_type}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!task.completed_at ? (
                      <form action={handleComplete}>
                        <input type="hidden" name="id" value={task.id} />
                        <Button type="submit" variant="secondary" className="text-xs px-2 py-1">
                          Done
                        </Button>
                      </form>
                    ) : (
                      <form action={handleReopen}>
                        <input type="hidden" name="id" value={task.id} />
                        <Button type="submit" variant="ghost" className="text-xs px-2 py-1">
                          Reopen
                        </Button>
                      </form>
                    )}
                    <ConfirmDeleteButton
                      action={handleDelete}
                      hiddenFields={{ id: task.id }}
                      title="Delete task?"
                      description={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
