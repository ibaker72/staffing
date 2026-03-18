/**
 * Email sending utility.
 *
 * Uses Supabase Edge Functions + Resend by default.
 * Set RESEND_API_KEY in your environment.
 * Falls back to console logging in development when no key is set.
 *
 * To swap providers, replace the sendEmail implementation.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const FROM_DEFAULT = process.env.EMAIL_FROM ?? "Staffing Engine <noreply@staffingengine.app>";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function getAppUrl(): string {
  return APP_URL;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, from = FROM_DEFAULT } = payload;

  // Development fallback: log to console
  if (!RESEND_API_KEY) {
    console.log(`[email:dev] To: ${to}`);
    console.log(`[email:dev] Subject: ${subject}`);
    console.log(`[email:dev] From: ${from}`);
    console.log(`[email:dev] Body length: ${html.length} chars`);
    return { success: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error:", res.status, body);
      return { success: false, error: `Resend ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[email] Send failed:", msg);
    return { success: false, error: msg };
  }
}
