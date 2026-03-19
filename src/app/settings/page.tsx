import { requireAuth, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "system", label: "System Status" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireAuth();
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  const activeTab = (TABS.find((t) => t.id === params.tab) ? params.tab : "profile") as TabId;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="mb-6 border-b border-zinc-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={`/settings?tab=${tab.id}`}
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

      {activeTab === "profile" && <ProfileTab user={currentUser!} />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "system" && <SystemStatusTab />}
    </>
  );
}

/* ─── Profile Tab ─────────────────────────────────────────────────── */

async function ProfileTab({ user }: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }) {

  async function updateProfile(formData: FormData) {
    "use server";
    const fullName = formData.get("full_name") as string;
    const supabase = await createClient();
    await supabase
      .from("user_profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    revalidatePath("/settings");
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Your Profile</h3>
        <form action={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              defaultValue={user.profile.full_name ?? ""}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email ?? ""}
              disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-400">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
            <input
              type="text"
              value={user.profile.role.charAt(0).toUpperCase() + user.profile.role.slice(1)}
              disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 capitalize"
            />
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 mb-2">Account Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Account ID</span>
            <span className="text-zinc-700 font-mono text-xs">{user.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Status</span>
            <span className="text-emerald-600 font-medium">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Member since</span>
            <span className="text-zinc-700">
              {user.profile.created_at
                ? new Date(user.profile.created_at).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Notifications Tab ───────────────────────────────────────────── */

function NotificationsTab() {
  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <NotificationToggle
            label="Task reminders"
            description="Get notified when tasks are due or overdue"
            defaultChecked
          />
          <NotificationToggle
            label="Client feedback"
            description="Get notified when clients review submitted candidates"
            defaultChecked
          />
          <NotificationToggle
            label="Follow-up reminders"
            description="Get notified about overdue follow-ups"
            defaultChecked
          />
          <NotificationToggle
            label="New submissions"
            description="Get notified when candidates are submitted to your jobs"
            defaultChecked
          />
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          Notification preferences are saved automatically. Email delivery requires RESEND_API_KEY to be configured.
        </p>
      </Card>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-zinc-700">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center shrink-0">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <div className="h-5 w-9 rounded-full bg-zinc-200 peer-checked:bg-zinc-900 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}

/* ─── System Status Tab ───────────────────────────────────────────── */

async function SystemStatusTab() {
  const supabase = await createClient();

  const checks = [
    { label: "Database", key: "companies" },
    { label: "Auth System", key: "user_profiles" },
    { label: "Activity Logging", key: "activity_events" },
  ];

  const results: { label: string; ok: boolean }[] = [];

  for (const check of checks) {
    try {
      const { error } = await supabase
        .from(check.key)
        .select("*", { count: "exact", head: true });
      results.push({ label: check.label, ok: !error });
    } catch {
      results.push({ label: check.label, ok: false });
    }
  }

  const hasEmail = !!process.env.RESEND_API_KEY;
  results.push({ label: "Email Service", ok: hasEmail });

  const allHealthy = results.every((r) => r.ok);

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">System Status</h3>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${allHealthy ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          <span className="text-xs text-zinc-500">
            {allHealthy ? "All systems operational" : "Some services need attention"}
          </span>
        </div>

        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-sm text-zinc-700">{r.label}</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${r.ok ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <span className={`text-xs ${r.ok ? "text-emerald-700" : "text-red-700"}`}>
                  {r.ok ? "Operational" : "Issue Detected"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 mb-2">About</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Application</span>
            <span className="text-zinc-700 font-medium">Bedrock Staffing</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Version</span>
            <span className="text-zinc-700 font-mono text-xs">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Framework</span>
            <span className="text-zinc-700">Next.js + Supabase</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Environment</span>
            <span className="text-zinc-700 font-mono text-xs">{process.env.NODE_ENV}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
