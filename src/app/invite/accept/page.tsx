"use client";

import { useState, useEffect, Suspense } from "react";
import { acceptClientInvitation } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [invitation, setInvitation] = useState<{ email: string; company_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    async function loadInvitation() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("client_invitations")
        .select("email, company:companies(name)")
        .eq("token", token!)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (fetchError || !data) {
        setError("This invitation is invalid or has expired.");
      } else {
        const companyName = (data.company as { name?: string } | null)?.name ?? "Unknown";
        setInvitation({ email: data.email, company_name: companyName });
      }
      setLoading(false);
    }

    loadInvitation();
  }, [token]);

  async function handleSubmit(formData: FormData) {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    const result = await acceptClientInvitation(token, formData);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading invitation...</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-xl border border-zinc-200 p-6 text-center">
          <h1 className="text-lg font-bold text-zinc-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-zinc-500">{error ?? "This invitation link is not valid."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Staffing Engine</h1>
          <p className="text-sm text-zinc-500 mt-1">
            You&apos;ve been invited to join <strong>{invitation.company_name}</strong>
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4 bg-white rounded-xl border border-zinc-200 p-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              value={invitation.email}
              disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="Min 8 characters"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Accept Invitation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
