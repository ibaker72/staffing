"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function PortalTokenPanel({
  token,
  expiresAt,
  onGenerate,
}: {
  token: string | null;
  expiresAt: string | null;
  onGenerate: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    startTransition(async () => {
      await onGenerate();
    });
  }

  function handleCopy() {
    if (!token) return;
    const url = `${window.location.origin}/portal?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!token) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-500">No active portal link. Generate one to share with this client.</p>
        <Button variant="secondary" className="text-xs" onClick={handleGenerate} disabled={isPending}>
          {isPending ? "Generating…" : "Generate Portal Link"}
        </Button>
      </div>
    );
  }

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <div className="space-y-2">
      {isExpired ? (
        <p className="text-xs text-red-600 font-medium">Token expired. Generate a new one.</p>
      ) : (
        <p className="text-xs text-zinc-500">
          Expires {expiresAt ? new Date(expiresAt).toLocaleDateString() : "—"}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" className="text-xs" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy Portal Link"}
        </Button>
        <Button variant="secondary" className="text-xs" onClick={handleGenerate} disabled={isPending}>
          {isPending ? "Generating…" : "Regenerate"}
        </Button>
      </div>
    </div>
  );
}
