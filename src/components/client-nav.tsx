"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth";

export function ClientNav({ user }: { user: AuthUser }) {
  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7 shrink-0">
            <rect x="4" y="20" width="24" height="5" rx="1.5" fill="#18181b"/>
            <rect x="7" y="14" width="18" height="5" rx="1.5" fill="#3f3f46"/>
            <rect x="10" y="8" width="12" height="5" rx="1.5" fill="#71717a"/>
          </svg>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Bedrock Staffing</h1>
            <p className="text-xs text-zinc-500">Client Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">{user.profile.full_name || user.email}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="text-xs">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
