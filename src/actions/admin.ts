"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface SystemDiagnostics {
  database: {
    connected: boolean;
    tables: { name: string; exists: boolean; rowCount: number }[];
  };
  auth: {
    totalUsers: number;
    activeUsers: number;
    adminCount: number;
    recruiterCount: number;
    clientCount: number;
  };
  data: {
    companies: number;
    candidates: number;
    jobs: number;
    placements: number;
    tasks: number;
    submissions: number;
    activityEvents: number;
  };
  environment: {
    hasSupabaseUrl: boolean;
    hasSupabaseKey: boolean;
    nodeEnv: string;
  };
}

export async function getSystemDiagnostics(): Promise<SystemDiagnostics> {
  await requireAdmin();
  const supabase = await createClient();

  // Check tables
  const tableNames = [
    "companies",
    "candidates",
    "jobs",
    "placements",
    "tasks",
    "candidate_submissions",
    "activity_events",
    "user_profiles",
    "audit_log",
    "automation_runs",
    "import_logs",
  ];
  const tables: { name: string; exists: boolean; rowCount: number }[] = [];

  for (const table of tableNames) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      tables.push({ name: table, exists: !error, rowCount: count ?? 0 });
    } catch {
      tables.push({ name: table, exists: false, rowCount: 0 });
    }
  }

  // Auth stats
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("role, is_active");
  const profileList = profiles ?? [];

  // Data counts - reuse from table checks
  const getCount = (name: string) =>
    tables.find((t) => t.name === name)?.rowCount ?? 0;

  return {
    database: {
      connected: tables.some((t) => t.exists),
      tables,
    },
    auth: {
      totalUsers: profileList.length,
      activeUsers: profileList.filter((p) => p.is_active).length,
      adminCount: profileList.filter((p) => p.role === "admin").length,
      recruiterCount: profileList.filter((p) => p.role === "recruiter").length,
      clientCount: profileList.filter((p) => p.role === "client").length,
    },
    data: {
      companies: getCount("companies"),
      candidates: getCount("candidates"),
      jobs: getCount("jobs"),
      placements: getCount("placements"),
      tasks: getCount("tasks"),
      submissions: getCount("candidate_submissions"),
      activityEvents: getCount("activity_events"),
    },
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV ?? "unknown",
    },
  };
}

export async function getImportHistory(limit: number = 20) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("import_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

export async function getAutomationHistory(limit: number = 20) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

export async function seedDemoData() {
  await requireAdmin();
  const supabase = await createClient();

  // Insert demo companies
  const { data: companies } = await supabase
    .from("companies")
    .insert([
      {
        name: "TechVentures Inc",
        industry: "Technology",
        location: "San Francisco, CA",
        contact_name: "Sarah Chen",
        contact_email: "sarah@techventures.io",
        contact_phone: "415-555-0101",
        status: "active" as const,
        website: "https://techventures.io",
      },
      {
        name: "Meridian Healthcare",
        industry: "Healthcare",
        location: "Boston, MA",
        contact_name: "Dr. James Wilson",
        contact_email: "jwilson@meridianhealth.com",
        contact_phone: "617-555-0202",
        status: "active" as const,
      },
      {
        name: "Atlas Financial Group",
        industry: "Finance",
        location: "New York, NY",
        contact_name: "Michael Torres",
        contact_email: "mtorres@atlasfinancial.com",
        contact_phone: "212-555-0303",
        status: "lead" as const,
      },
      {
        name: "GreenField Energy",
        industry: "Energy",
        location: "Austin, TX",
        contact_name: "Lisa Park",
        contact_email: "lpark@greenfieldenergy.com",
        status: "lead" as const,
      },
      {
        name: "Pinnacle Consulting",
        industry: "Consulting",
        location: "Chicago, IL",
        contact_name: "Robert Kim",
        contact_email: "rkim@pinnacle.com",
        contact_phone: "312-555-0505",
        status: "active" as const,
      },
    ])
    .select();

  const companyIds = (companies ?? []).map((c: Record<string, unknown>) => c.id as string);

  // Insert demo candidates
  await supabase.from("candidates").insert([
    {
      full_name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "555-0601",
      location: "San Francisco, CA",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      years_experience: 7,
      desired_salary: 165000,
      status: "new" as const,
    },
    {
      full_name: "David Kim",
      email: "dkim@email.com",
      phone: "555-0602",
      location: "Remote",
      skills: ["Agile", "Roadmapping", "Analytics", "Stakeholder Management"],
      years_experience: 10,
      desired_salary: 155000,
      status: "contacted" as const,
    },
    {
      full_name: "Jessica Patel",
      email: "jpatel@email.com",
      phone: "555-0603",
      location: "Boston, MA",
      skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
      years_experience: 5,
      desired_salary: 140000,
      status: "new" as const,
    },
    {
      full_name: "Marcus Johnson",
      email: "mjohnson@email.com",
      phone: "555-0604",
      location: "New York, NY",
      skills: ["Excel", "Bloomberg", "Python", "Financial Modeling"],
      years_experience: 4,
      desired_salary: 95000,
      status: "interviewing" as const,
    },
    {
      full_name: "Sophia Lee",
      email: "slee@email.com",
      phone: "555-0605",
      location: "Austin, TX",
      skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
      years_experience: 6,
      desired_salary: 130000,
      status: "new" as const,
    },
    {
      full_name: "Andrew Martinez",
      email: "amartinez@email.com",
      location: "Chicago, IL",
      skills: ["AWS", "Kubernetes", "Terraform", "CI/CD"],
      years_experience: 8,
      desired_salary: 170000,
      status: "contacted" as const,
    },
  ]);

  // Insert demo jobs if we have company IDs
  if (companyIds.length >= 3) {
    await supabase.from("jobs").insert([
      {
        title: "Senior React Developer",
        company_id: companyIds[0],
        location: "San Francisco, CA",
        description:
          "Build and maintain our customer-facing web application using React and TypeScript.",
        employment_type: "full_time" as const,
        pay_type: "salary" as const,
        salary_range: "$150,000 - $190,000",
        priority: "high" as const,
        status: "open" as const,
      },
      {
        title: "Data Analyst",
        company_id: companyIds[1],
        location: "Boston, MA",
        description:
          "Analyze healthcare data to identify trends and improve patient outcomes.",
        employment_type: "full_time" as const,
        pay_type: "salary" as const,
        salary_range: "$90,000 - $120,000",
        priority: "medium" as const,
        status: "open" as const,
      },
      {
        title: "Financial Controller",
        company_id: companyIds[2],
        location: "New York, NY",
        description:
          "Oversee all financial operations including reporting, budgeting, and compliance.",
        employment_type: "full_time" as const,
        pay_type: "salary" as const,
        salary_range: "$130,000 - $160,000",
        priority: "high" as const,
        status: "open" as const,
      },
      {
        title: "Contract UX Designer",
        company_id: companyIds[0],
        location: "Remote",
        description:
          "Design intuitive interfaces for our mobile application.",
        employment_type: "contract" as const,
        pay_type: "hourly" as const,
        salary_range: "$75 - $95/hr",
        priority: "medium" as const,
        status: "open" as const,
      },
    ]);
  }

  // Insert demo tasks
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  await supabase.from("tasks").insert([
    {
      title: "Review new candidate applications",
      priority: "high" as const,
      due_date: today,
    },
    {
      title: "Send follow-up to TechVentures",
      priority: "medium" as const,
      due_date: nextWeek,
    },
    {
      title: "Update job descriptions for Q2",
      priority: "low" as const,
      due_date: nextWeek,
    },
    {
      title: "Schedule interview with candidate",
      priority: "urgent" as const,
      due_date: yesterday,
    },
  ]);

  revalidatePath("/", "layout");

  return {
    companies: companyIds.length,
    candidates: 6,
    jobs: companyIds.length >= 3 ? 4 : 0,
    tasks: 4,
  };
}

export async function resetDemoData(): Promise<{
  deleted: { companies: number; candidates: number; jobs: number; tasks: number; placements: number; submissions: number };
}> {
  await requireAdmin();
  const supabase = await createClient();

  // Delete in dependency order (submissions before jobs/candidates, placements before jobs)
  // Activity events and audit log are preserved for traceability
  const tables = [
    "candidate_submissions",
    "placements",
    "tasks",
    "jobs",
    "candidates",
    "companies",
  ] as const;

  const deleted: Record<string, number> = {};

  for (const table of tables) {
    const { data } = await supabase.from(table).select("id");
    const count = data?.length ?? 0;

    if (count > 0) {
      const ids = data!.map((r: { id: string }) => r.id);
      await supabase.from(table).delete().in("id", ids);
    }

    deleted[table === "candidate_submissions" ? "submissions" : table] = count;
  }

  revalidatePath("/", "layout");

  return {
    deleted: {
      companies: deleted.companies ?? 0,
      candidates: deleted.candidates ?? 0,
      jobs: deleted.jobs ?? 0,
      tasks: deleted.tasks ?? 0,
      placements: deleted.placements ?? 0,
      submissions: deleted.submissions ?? 0,
    },
  };
}

export async function getRecentAuditLog(limit: number = 30) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}
