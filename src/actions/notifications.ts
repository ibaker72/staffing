"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, clientInvitationEmail, candidateSubmittedEmail, clientFeedbackNotificationEmail, taskDueReminderEmail, overdueFollowUpEmail, getAppUrl } from "@/lib/email";
import type { UserProfile } from "@/types/database";

/**
 * Fire-and-forget notification helpers.
 * All functions catch errors internally so they never block the calling action.
 */

export async function notifyClientInvitation(email: string, companyName: string, inviterName: string, token: string) {
  try {
    const tpl = clientInvitationEmail({ companyName, inviterName, token });
    await sendEmail({ to: email, ...tpl });
  } catch (e) {
    console.error("[notify:clientInvitation]", e);
  }
}

export async function notifyCandidateSubmittedToClient(jobId: string, candidateName: string, jobTitle: string) {
  try {
    const supabase = await createClient();
    // Find the company contact email for this job
    const { data: job } = await supabase
      .from("jobs")
      .select("company_id, company:companies(contact_email, name)")
      .eq("id", jobId)
      .maybeSingle();

    const company = job?.company as { contact_email?: string; name?: string } | null;
    const contactEmail = company?.contact_email;
    if (!contactEmail) return;

    // Also check for client users with accounts
    const { data: clientUsers } = await supabase
      .from("client_users")
      .select("user:user_profiles(email)")
      .eq("company_id", job?.company_id ?? "");

    const emails = new Set<string>();
    if (contactEmail) emails.add(contactEmail);
    for (const cu of clientUsers ?? []) {
      const userEmail = (cu.user as { email?: string } | null)?.email;
      if (userEmail) emails.add(userEmail);
    }

    const portalUrl = `${getAppUrl()}/client`;
    const tpl = candidateSubmittedEmail({ candidateName, jobTitle, portalUrl });

    for (const to of emails) {
      await sendEmail({ to, ...tpl });
    }
  } catch (e) {
    console.error("[notify:candidateSubmitted]", e);
  }
}

export async function notifyClientFeedbackReceived(
  submissionId: string,
  newStatus: string,
  feedback: string | null
) {
  try {
    const supabase = await createClient();
    const { data: sub } = await supabase
      .from("candidate_submissions")
      .select("candidate:candidates(full_name), job:jobs(title, owner_id, company:companies(name))")
      .eq("id", submissionId)
      .maybeSingle();

    const candidateName = (sub?.candidate as { full_name?: string } | null)?.full_name ?? "Unknown";
    const job = sub?.job as { title?: string; owner_id?: string; company?: { name?: string } } | null;
    const jobTitle = job?.title ?? "Unknown";
    const companyName = job?.company?.name ?? "Unknown";
    const ownerId = job?.owner_id;

    if (!ownerId) return;

    // Get owner email
    const { data: owner } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", ownerId)
      .maybeSingle();

    const ownerEmail = (owner as UserProfile | null)?.email;
    if (!ownerEmail) return;

    const tpl = clientFeedbackNotificationEmail({
      candidateName,
      jobTitle,
      companyName,
      newStatus,
      feedback,
    });
    await sendEmail({ to: ownerEmail, ...tpl });
  } catch (e) {
    console.error("[notify:clientFeedback]", e);
  }
}

export async function sendTaskDueReminders() {
  try {
    const supabase = await createClient();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, due_date, entity_type, entity_id, owner_id")
      .eq("due_date", tomorrowStr)
      .is("completed_at", null);

    for (const task of tasks ?? []) {
      if (!task.owner_id) continue;
      const { data: owner } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("id", task.owner_id)
        .maybeSingle();

      const ownerEmail = (owner as UserProfile | null)?.email;
      if (!ownerEmail) continue;

      const tpl = taskDueReminderEmail({
        taskTitle: task.title,
        dueDate: task.due_date!,
        entityLabel: task.entity_type ? `${task.entity_type}` : undefined,
      });
      await sendEmail({ to: ownerEmail, ...tpl });
    }
  } catch (e) {
    console.error("[notify:taskDueReminders]", e);
  }
}

export async function sendOverdueFollowUpReminders() {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // Companies with overdue follow-ups
    const { data: companies } = await supabase
      .from("companies")
      .select("name, follow_up_date, owner_id")
      .lt("follow_up_date", today)
      .not("follow_up_date", "is", null);

    for (const c of companies ?? []) {
      if (!c.owner_id) continue;
      const { data: owner } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("id", c.owner_id)
        .maybeSingle();

      const ownerEmail = (owner as UserProfile | null)?.email;
      if (!ownerEmail) continue;

      const tpl = overdueFollowUpEmail({
        entityType: "company",
        entityName: c.name,
        followUpDate: c.follow_up_date!,
      });
      await sendEmail({ to: ownerEmail, ...tpl });
    }

    // Candidates with overdue follow-ups
    const { data: candidates } = await supabase
      .from("candidates")
      .select("full_name, follow_up_date, owner_id")
      .lt("follow_up_date", today)
      .not("follow_up_date", "is", null);

    for (const c of candidates ?? []) {
      if (!c.owner_id) continue;
      const { data: owner } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("id", c.owner_id)
        .maybeSingle();

      const ownerEmail = (owner as UserProfile | null)?.email;
      if (!ownerEmail) continue;

      const tpl = overdueFollowUpEmail({
        entityType: "candidate",
        entityName: c.full_name,
        followUpDate: c.follow_up_date!,
      });
      await sendEmail({ to: ownerEmail, ...tpl });
    }
  } catch (e) {
    console.error("[notify:overdueFollowUp]", e);
  }
}
