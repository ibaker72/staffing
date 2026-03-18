import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import type { UserProfile, UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  recruiter: "Recruiter",
  client: "Client",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  recruiter: "bg-blue-50 text-blue-700",
  client: "bg-amber-50 text-amber-700",
};

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: rawUsers } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  const users = (rawUsers ?? []) as UserProfile[];

  async function updateRole(formData: FormData) {
    "use server";
    const userId = formData.get("user_id") as string;
    const role = formData.get("role") as UserRole;
    const innerSupabase = await createClient();
    await innerSupabase.from("user_profiles").update({ role }).eq("id", userId);
    revalidatePath("/admin");
  }

  async function toggleActive(formData: FormData) {
    "use server";
    const userId = formData.get("user_id") as string;
    const isActive = formData.get("is_active") === "true";
    const innerSupabase = await createClient();
    await innerSupabase.from("user_profiles").update({ is_active: !isActive }).eq("id", userId);
    revalidatePath("/admin");
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage user accounts and roles"
      />

      <Card>
        <div className="divide-y divide-zinc-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {u.full_name || "Unnamed"}
                </p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[u.role] ?? "bg-zinc-100 text-zinc-700"}`}>
                  {roleLabels[u.role] ?? u.role}
                </span>

                <form action={updateRole} className="flex gap-1">
                  <input type="hidden" name="user_id" value={u.id} />
                  <select
                    name="role"
                    defaultValue={u.role}
                    className="text-xs rounded border border-zinc-200 px-1 py-0.5"
                  >
                    <option value="admin">Admin</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="client">Client</option>
                  </select>
                  <Button type="submit" variant="ghost" className="text-xs px-1.5 py-0.5">
                    Set
                  </Button>
                </form>

                <form action={toggleActive}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <input type="hidden" name="is_active" value={String(u.is_active)} />
                  <Button
                    type="submit"
                    variant="ghost"
                    className={`text-xs px-2 py-0.5 ${u.is_active ? "text-red-500" : "text-emerald-500"}`}
                  >
                    {u.is_active ? "Disable" : "Enable"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-zinc-500 py-2">No users found.</p>
          )}
        </div>
      </Card>
    </>
  );
}
