"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OutreachStatus } from "@/types/database";

const outreachLabels: Record<OutreachStatus, string> = {
  none: "None",
  initial_contact: "Initial Contact",
  follow_up: "Follow-up",
  in_conversation: "In Conversation",
  nurturing: "Nurturing",
  closed: "Closed",
};

const outreachOptions: OutreachStatus[] = [
  "none",
  "initial_contact",
  "follow_up",
  "in_conversation",
  "nurturing",
  "closed",
];

export function OutreachPanel({
  entityId,
  currentStatus,
  currentFollowUp,
  onUpdate,
}: {
  entityId: string;
  currentStatus: OutreachStatus;
  currentFollowUp: string | null;
  onUpdate: (id: string, status: OutreachStatus, followUpDate: string | null) => Promise<void>;
}) {
  const [status, setStatus] = useState<OutreachStatus>(currentStatus);
  const [followUp, setFollowUp] = useState(currentFollowUp ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(entityId, status, followUp || null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Outreach Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OutreachStatus)}
          className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {outreachOptions.map((opt) => (
            <option key={opt} value={opt}>
              {outreachLabels[opt]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Follow-up Date</label>
        <input
          type="date"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="text-xs w-full"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Update Outreach"}
      </Button>
    </div>
  );
}
