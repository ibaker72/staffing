"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth";

export function ClientNav({ user }: { user: AuthUser }) {
  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Staffing Engine</h1>
          <p className="text-xs text-zinc-500">Client Portal</p>
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
