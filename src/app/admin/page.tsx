import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import {
  getSystemDiagnostics,
  getImportHistory,
  getRecentAuditLog,
  getAutomationHistory,
} from "@/actions/admin";
import { RunAutomationsButton } from "@/components/run-automations-button";
import { SeedButton } from "@/components/seed-button";
import type { UserProfile, UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "system", label: "System" },
  { id: "users", label: "Users" },
  { id: "audit", label: "Audit Log" },
  { id: "imports", label: "Import History" },
  { id: "automations", label: "Automations" },
  { id: "quality", label: "Data Quality" },
  { id: "seed", label: "Seed Data" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "running...";
  const ms =
    new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const activeTab = (
    TABS.find((t) => t.id === params.tab) ? params.tab : "system"
  ) as TabId;

  return (
    <>
      <PageHeader
        title="Admin"
        description="System administration and diagnostics"
      />

      {/* Tab navigation */}
      <div className="mb-6 border-b border-zinc-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={`/admin?tab=${tab.id}`}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "system" && <SystemTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "audit" && <AuditTab />}
      {activeTab === "imports" && <ImportsTab />}
      {activeTab === "automations" && <AutomationsTab />}
      {activeTab === "quality" && <QualityTab />}
      {activeTab === "seed" && <SeedTab />}
    </>
  );
}

/* ─── System Tab ────────────────────────────────────────────────────── */

async function SystemTab() {
  const diagnostics = await getSystemDiagnostics();

  return (
    <div className="space-y-6">
      {/* Environment */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Environment
        </h3>
        <div className="space-y-2">
          <EnvRow
            label="NEXT_PUBLIC_SUPABASE_URL"
            ok={diagnostics.environment.hasSupabaseUrl}
          />
          <EnvRow
            label="NEXT_PUBLIC_SUPABASE_ANON_KEY"
            ok={diagnostics.environment.hasSupabaseKey}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">NODE_ENV</span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-700">
              {diagnostics.environment.nodeEnv}
            </span>
          </div>
        </div>
      </Card>

      {/* Database connection */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Database Connection
          </h3>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              diagnostics.database.connected ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-zinc-500">
            {diagnostics.database.connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* User stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatBox label="Total Users" value={diagnostics.auth.totalUsers} />
          <StatBox label="Active" value={diagnostics.auth.activeUsers} />
          <StatBox label="Admins" value={diagnostics.auth.adminCount} />
          <StatBox label="Recruiters" value={diagnostics.auth.recruiterCount} />
          <StatBox label="Clients" value={diagnostics.auth.clientCount} />
        </div>
      </Card>

      {/* Table inventory */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Table Inventory
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="pb-2 pr-4 font-medium text-zinc-700">Table</th>
                <th className="pb-2 pr-4 font-medium text-zinc-700">Status</th>
                <th className="pb-2 font-medium text-zinc-700 text-right">
                  Rows
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {diagnostics.database.tables.map((table) => (
                <tr key={table.name}>
                  <td className="py-2 pr-4 font-mono text-xs text-zinc-700">
                    {table.name}
                  </td>
                  <td className="py-2 pr-4">
                    {table.exists ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Exists
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right text-xs text-zinc-600">
                    {table.exists ? table.rowCount.toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Data counts summary */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Data Summary
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatBox label="Companies" value={diagnostics.data.companies} />
          <StatBox label="Candidates" value={diagnostics.data.candidates} />
          <StatBox label="Jobs" value={diagnostics.data.jobs} />
          <StatBox label="Placements" value={diagnostics.data.placements} />
          <StatBox label="Tasks" value={diagnostics.data.tasks} />
          <StatBox label="Submissions" value={diagnostics.data.submissions} />
          <StatBox
            label="Activity Events"
            value={diagnostics.data.activityEvents}
          />
        </div>
      </Card>
    </div>
  );
}

function EnvRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-mono text-xs text-zinc-600">{label}</span>
      <span className="flex items-center gap-1.5">
        <span
          className={`inline-flex h-2 w-2 rounded-full ${
            ok ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span className={`text-xs ${ok ? "text-emerald-700" : "text-red-700"}`}>
          {ok ? "Set" : "Missing"}
        </span>
      </span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center">
      <p className="text-lg font-semibold text-zinc-900">{value}</p>
      <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}

/* ─── Users Tab ─────────────────────────────────────────────────────── */

async function UsersTab() {
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
    await innerSupabase
      .from("user_profiles")
      .update({ role })
      .eq("id", userId);
    revalidatePath("/admin");
  }

  async function toggleActive(formData: FormData) {
    "use server";
    const userId = formData.get("user_id") as string;
    const isActive = formData.get("is_active") === "true";
    const innerSupabase = await createClient();
    await innerSupabase
      .from("user_profiles")
      .update({ is_active: !isActive })
      .eq("id", userId);
    revalidatePath("/admin");
  }

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">
        User Management
      </h3>
      <div className="divide-y divide-zinc-100">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900">
                {u.full_name || "Unnamed"}
              </p>
              <p className="truncate text-xs text-zinc-500">{u.email}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[u.role] ?? "bg-zinc-100 text-zinc-700"}`}
              >
                {roleLabels[u.role] ?? u.role}
              </span>

              <form action={updateRole} className="flex gap-1">
                <input type="hidden" name="user_id" value={u.id} />
                <select
                  name="role"
                  defaultValue={u.role}
                  className="rounded border border-zinc-200 px-1 py-0.5 text-xs"
                >
                  <option value="admin">Admin</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="client">Client</option>
                </select>
                <Button
                  type="submit"
                  variant="ghost"
                  className="px-1.5 py-0.5 text-xs"
                >
                  Set
                </Button>
              </form>

              <form action={toggleActive}>
                <input type="hidden" name="user_id" value={u.id} />
                <input
                  type="hidden"
                  name="is_active"
                  value={String(u.is_active)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  className={`px-2 py-0.5 text-xs ${u.is_active ? "text-red-500" : "text-emerald-500"}`}
                >
                  {u.is_active ? "Disable" : "Enable"}
                </Button>
              </form>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="py-2 text-sm text-zinc-500">No users found.</p>
        )}
      </div>
    </Card>
  );
}

/* ─── Audit Log Tab ─────────────────────────────────────────────────── */

async function AuditTab() {
  const entries = await getRecentAuditLog();

  const actionColors: Record<string, string> = {
    create: "bg-emerald-50 text-emerald-700",
    delete: "bg-red-50 text-red-700",
    status_change: "bg-blue-50 text-blue-700",
    bulk: "bg-purple-50 text-purple-700",
    update: "bg-zinc-100 text-zinc-700",
  };

  function getActionColor(action: string): string {
    if (action.startsWith("bulk")) return actionColors.bulk;
    return actionColors[action] ?? actionColors.update;
  }

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">
        Recent Audit Log
      </h3>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          No audit log entries found. The audit_log table may not exist or may be
          empty.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="pb-2 pr-4 font-medium text-zinc-700">Time</th>
                <th className="pb-2 pr-4 font-medium text-zinc-700">Actor</th>
                <th className="pb-2 pr-4 font-medium text-zinc-700">Entity</th>
                <th className="pb-2 pr-4 font-medium text-zinc-700">Action</th>
                <th className="pb-2 font-medium text-zinc-700">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {entries.map((entry: Record<string, unknown>) => {
                const action = (entry.action as string) ?? (entry.event_type as string) ?? "unknown";
                const actor =
                  (entry.actor_email as string) ??
                  (entry.user_email as string) ??
                  (entry.actor_id as string) ??
                  (entry.user_id as string) ??
                  "-";
                const entityType =
                  (entry.entity_type as string) ?? "-";
                const entityName =
                  (entry.entity_name as string) ?? (entry.entity_id as string) ?? "";
                const previousValue = entry.previous_value as Record<string, unknown> | null;
                const newValue = entry.new_value as Record<string, unknown> | null;
                const createdAt = (entry.created_at as string) ?? "";

                return (
                  <tr key={entry.id as string}>
                    <td
                      className="whitespace-nowrap py-2 pr-4 text-xs text-zinc-500"
                      title={createdAt}
                    >
                      {createdAt ? formatRelativeTime(createdAt) : "-"}
                    </td>
                    <td className="py-2 pr-4 text-xs text-zinc-600 max-w-[150px] truncate">
                      {actor}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-xs text-zinc-500">{entityType}</span>
                      {entityName && (
                        <span className="ml-1 text-xs text-zinc-700">
                          {entityName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getActionColor(action)}`}
                      >
                        {action}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-zinc-600 max-w-[250px]">
                      {action === "status_change" &&
                      previousValue &&
                      newValue ? (
                        <span>
                          <span className="text-zinc-400">
                            {JSON.stringify(previousValue.status ?? previousValue)}
                          </span>
                          <span className="mx-1 text-zinc-300">&rarr;</span>
                          <span className="text-zinc-700">
                            {JSON.stringify(newValue.status ?? newValue)}
                          </span>
                        </span>
                      ) : (
                        <span className="truncate">
                          {(entry.description as string) ?? ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ─── Import History Tab ────────────────────────────────────────────── */

async function ImportsTab() {
  const imports = await getImportHistory();

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">
        Import History
      </h3>
      {imports.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          No import history found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="pb-2 pr-4 font-medium text-zinc-700">Time</th>
                <th className="pb-2 pr-4 font-medium text-zinc-700">Type</th>
                <th className="pb-2 pr-4 font-medium text-zinc-700">File</th>
                <th className="pb-2 pr-4 font-medium text-zinc-700 text-right">
                  Rows
                </th>
                <th className="pb-2 pr-4 font-medium text-zinc-700 text-right">
                  Imported
                </th>
                <th className="pb-2 pr-4 font-medium text-zinc-700 text-right">
                  Errors
                </th>
                <th className="pb-2 font-medium text-zinc-700">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(imports as Array<{
                id: string;
                entity_type: string;
                file_name: string | null;
                total_rows: number;
                imported_count: number;
                error_count: number;
                imported_by: string | null;
                created_at: string;
              }>).map(
                (row) => (
                  <tr key={row.id}>
                    <td
                      className="whitespace-nowrap py-2 pr-4 text-xs text-zinc-500"
                      title={row.created_at}
                    >
                      {formatRelativeTime(row.created_at)}
                    </td>
                    <td className="py-2 pr-4 text-xs capitalize text-zinc-700">
                      {row.entity_type}
                    </td>
                    <td className="py-2 pr-4 text-xs text-zinc-600 max-w-[200px] truncate">
                      {row.file_name ?? "-"}
                    </td>
                    <td className="py-2 pr-4 text-right text-xs text-zinc-600">
                      {row.total_rows}
                    </td>
                    <td className="py-2 pr-4 text-right text-xs text-emerald-700">
                      {row.imported_count}
                    </td>
                    <td className="py-2 pr-4 text-right text-xs">
                      <span
                        className={
                          row.error_count > 0
                            ? "text-red-600 font-medium"
                            : "text-zinc-400"
                        }
                      >
                        {row.error_count}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-zinc-500 max-w-[150px] truncate">
                      {row.imported_by ? row.imported_by.slice(0, 8) + "..." : "-"}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ─── Automations Tab ───────────────────────────────────────────────── */

async function AutomationsTab() {
  const history = await getAutomationHistory();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Run Automations
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Execute all automation rules (follow-ups, stale submissions, stale
              jobs, stale candidates).
            </p>
          </div>
          <RunAutomationsButton />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Automation Run History
        </h3>
        {history.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            No automation runs recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left">
                  <th className="pb-2 pr-4 font-medium text-zinc-700">Time</th>
                  <th className="pb-2 pr-4 font-medium text-zinc-700">Mode</th>
                  <th className="pb-2 pr-4 font-medium text-zinc-700 text-right">
                    Found
                  </th>
                  <th className="pb-2 pr-4 font-medium text-zinc-700 text-right">
                    Created
                  </th>
                  <th className="pb-2 font-medium text-zinc-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(history as Array<{
                  id: string;
                  started_at: string;
                  completed_at: string | null;
                  total_found: number;
                  total_created: number;
                  dry_run: boolean;
                }>).map(
                  (run) => (
                    <tr key={run.id}>
                      <td
                        className="whitespace-nowrap py-2 pr-4 text-xs text-zinc-500"
                        title={run.started_at}
                      >
                        {formatRelativeTime(run.started_at)}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            run.dry_run
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {run.dry_run ? "dry run" : "live"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-xs text-zinc-600">
                        {run.total_found}
                      </td>
                      <td className="py-2 pr-4 text-right text-xs text-zinc-600">
                        {run.total_created}
                      </td>
                      <td className="py-2 text-xs text-zinc-500">
                        {formatDuration(run.started_at, run.completed_at)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─── Data Quality Tab ──────────────────────────────────────────────── */

async function QualityTab() {
  const supabase = await createClient();

  // Compute data quality scores inline since there's no data-quality action
  const { data: companies } = await supabase.from("companies").select("*");
  const { data: candidates } = await supabase.from("candidates").select("*");
  const { data: jobs } = await supabase.from("jobs").select("*");

  function scoreCompany(c: Record<string, unknown>): number {
    let score = 0;
    const total = 6;
    if (c.name) score++;
    if (c.industry) score++;
    if (c.location) score++;
    if (c.contact_name) score++;
    if (c.contact_email) score++;
    if (c.contact_phone) score++;
    return Math.round((score / total) * 100);
  }

  function scoreCandidate(c: Record<string, unknown>): number {
    let score = 0;
    const total = 6;
    if (c.full_name) score++;
    if (c.email) score++;
    if (c.phone) score++;
    if (c.location) score++;
    if (Array.isArray(c.skills) && c.skills.length > 0) score++;
    if (c.years_experience != null) score++;
    return Math.round((score / total) * 100);
  }

  function scoreJob(j: Record<string, unknown>): number {
    let score = 0;
    const total = 5;
    if (j.title) score++;
    if (j.company_id) score++;
    if (j.description) score++;
    if (j.location) score++;
    if (j.salary_range) score++;
    return Math.round((score / total) * 100);
  }

  const companyList = companies ?? [];
  const candidateList = candidates ?? [];
  const jobList = jobs ?? [];

  const companyScores = companyList.map(scoreCompany);
  const candidateScores = candidateList.map(scoreCandidate);
  const jobScores = jobList.map(scoreJob);

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const qualityData = [
    {
      label: "Companies",
      total: companyList.length,
      avgScore: avg(companyScores),
      critical: companyScores.filter((s) => s < 50).length,
    },
    {
      label: "Candidates",
      total: candidateList.length,
      avgScore: avg(candidateScores),
      critical: candidateScores.filter((s) => s < 50).length,
    },
    {
      label: "Jobs",
      total: jobList.length,
      avgScore: avg(jobScores),
      critical: jobScores.filter((s) => s < 50).length,
    },
  ];

  function scoreColor(score: number): string {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  }

  function scoreBgColor(score: number): string {
    if (score >= 80) return "bg-emerald-100";
    if (score >= 60) return "bg-amber-100";
    return "bg-red-100";
  }

  function scoreTextColor(score: number): string {
    if (score >= 80) return "text-emerald-700";
    if (score >= 60) return "text-amber-700";
    return "text-red-700";
  }

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {qualityData.map((item) => (
        <Card key={item.label}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              {item.label}
            </h3>
            <span
              className={`text-lg font-bold ${scoreTextColor(item.avgScore)}`}
            >
              {item.avgScore}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            className={`mb-3 h-2 w-full rounded-full ${scoreBgColor(item.avgScore)}`}
          >
            <div
              className={`h-2 rounded-full ${scoreColor(item.avgScore)}`}
              style={{ width: `${item.avgScore}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-zinc-500">
            <span>{item.total} total records</span>
            {item.critical > 0 ? (
              <span className="font-medium text-red-600">
                {item.critical} critical
              </span>
            ) : (
              <span className="text-emerald-600">No critical issues</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Seed Data Tab ─────────────────────────────────────────────────── */

function SeedTab() {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">
        Seed Demo Data
      </h3>
      <SeedButton />
    </Card>
  );
}
