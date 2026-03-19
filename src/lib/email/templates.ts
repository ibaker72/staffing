import { getAppUrl } from "./send";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;color:#18181b">
<div style="max-width:560px;margin:0 auto;padding:40px 20px">
<div style="text-align:center;margin-bottom:24px">
  <svg viewBox="0 0 32 32" width="36" height="36" style="display:inline-block">
    <rect x="4" y="20" width="24" height="5" rx="1.5" fill="#18181b"/>
    <rect x="7" y="14" width="18" height="5" rx="1.5" fill="#3f3f46"/>
    <rect x="10" y="8" width="12" height="5" rx="1.5" fill="#71717a"/>
  </svg>
</div>
<div style="background:#fff;border-radius:12px;border:1px solid #e4e4e7;padding:32px">
${content}
</div>
<p style="text-align:center;font-size:12px;color:#a1a1aa;margin-top:24px">
Bedrock Staffing &middot; Reliable recruiting, solid results.
</p>
</div>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:500;margin-top:16px">${label}</a>`;
}

// ─── Client Invitation ───────────────────────────────────────────

export function clientInvitationEmail(params: {
  companyName: string;
  inviterName: string;
  token: string;
}): { subject: string; html: string } {
  const url = `${getAppUrl()}/invite/accept?token=${params.token}`;
  return {
    subject: `You've been invited to ${params.companyName} on Bedrock Staffing`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:18px">You're invited</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        ${params.inviterName} has invited you to join <strong>${params.companyName}</strong> on Bedrock Staffing.
        You'll be able to review submitted candidates and provide feedback.
      </p>
      ${button(url, "Accept Invitation")}
      <p style="font-size:12px;color:#a1a1aa;margin-top:16px">This link expires in 7 days.</p>
    `),
  };
}

// ─── Task Due Reminder ───────────────────────────────────────────

export function taskDueReminderEmail(params: {
  taskTitle: string;
  dueDate: string;
  entityLabel?: string;
}): { subject: string; html: string } {
  const url = `${getAppUrl()}/tasks`;
  return {
    subject: `Task due: ${params.taskTitle}`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Task Reminder</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Your task <strong>${params.taskTitle}</strong> is due on <strong>${params.dueDate}</strong>.
        ${params.entityLabel ? `<br>Related to: ${params.entityLabel}` : ""}
      </p>
      ${button(url, "View Tasks")}
    `),
  };
}

// ─── Overdue Follow-up Reminder ──────────────────────────────────

export function overdueFollowUpEmail(params: {
  entityType: "company" | "candidate";
  entityName: string;
  followUpDate: string;
}): { subject: string; html: string } {
  const path = params.entityType === "company" ? "companies" : "candidates";
  const url = `${getAppUrl()}/${path}`;
  return {
    subject: `Overdue follow-up: ${params.entityName}`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Overdue Follow-up</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Your follow-up with <strong>${params.entityName}</strong> was due on <strong>${params.followUpDate}</strong>.
        Please reach out or update the follow-up date.
      </p>
      ${button(url, `View ${params.entityType === "company" ? "Companies" : "Candidates"}`)}
    `),
  };
}

// ─── Client Feedback Notification (to recruiter) ─────────────────

export function clientFeedbackNotificationEmail(params: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  newStatus: string;
  feedback: string | null;
}): { subject: string; html: string } {
  const url = `${getAppUrl()}/jobs`;
  return {
    subject: `Client feedback: ${params.candidateName} for ${params.jobTitle}`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Client Feedback Received</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        <strong>${params.companyName}</strong> has reviewed the submission of
        <strong>${params.candidateName}</strong> for <strong>${params.jobTitle}</strong>.
      </p>
      <div style="background:#f4f4f5;border-radius:8px;padding:12px 16px;margin:12px 0">
        <p style="font-size:13px;margin:0"><strong>Status:</strong> ${params.newStatus}</p>
        ${params.feedback ? `<p style="font-size:13px;margin:8px 0 0"><strong>Feedback:</strong> ${params.feedback}</p>` : ""}
      </div>
      ${button(url, "View Jobs")}
    `),
  };
}

// ─── Candidate Submitted to Client ───────────────────────────────

export function candidateSubmittedEmail(params: {
  candidateName: string;
  jobTitle: string;
  portalUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `New candidate submitted: ${params.candidateName} for ${params.jobTitle}`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:18px">New Candidate Submitted</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        A new candidate, <strong>${params.candidateName}</strong>, has been submitted for the
        <strong>${params.jobTitle}</strong> position. Please review and provide your feedback.
      </p>
      ${button(params.portalUrl, "Review Candidate")}
    `),
  };
}
