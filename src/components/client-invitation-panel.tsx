"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

interface Invitation {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function ClientInvitationPanel({
  companyId,
  invitations,
  onInvite,
}: {
  companyId: string;
  invitations: Invitation[];
  onInvite: (formData: FormData) => Promise<{ token: string }>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleInvite(formData: FormData) {
    setError(null);
    setLastToken(null);
    formData.set("company_id", companyId);
    startTransition(async () => {
      try {
        const result = await onInvite(formData);
        setLastToken(result.token);
        setShowForm(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send invitation.");
      }
    });
  }

  function copyLink() {
    if (!lastToken) return;
    const url = `${window.location.origin}/invite/accept?token=${lastToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      {lastToken && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs text-emerald-700 font-medium mb-1">Invitation created!</p>
          <p className="text-xs text-emerald-600 mb-2">Share this link with the client:</p>
          <button onClick={copyLink} className="text-xs text-emerald-800 underline">
            {copied ? "Copied!" : "Copy invitation link"}
          </button>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="space-y-2">
          {invitations.slice(0, 5).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-700 truncate">{inv.email}</span>
              <span className={inv.accepted_at ? "text-emerald-600" : "text-zinc-400"}>
                {inv.accepted_at ? "Accepted" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form action={handleInvite} className="space-y-2">
          <input
            type="email"
            name="email"
            required
            placeholder="client@company.com"
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="text-xs" disabled={isPending}>
              {isPending ? "Inviting…" : "Send Invite"}
            </Button>
            <Button type="button" variant="ghost" className="text-xs" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="text-xs" onClick={() => setShowForm(true)}>
          Invite Client User
        </Button>
      )}
    </div>
  );
}
