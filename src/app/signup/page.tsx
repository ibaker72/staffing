"use client";

import { useState } from "react";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10">
              <rect x="4" y="20" width="24" height="5" rx="1.5" fill="#18181b"/>
              <rect x="7" y="14" width="18" height="5" rx="1.5" fill="#3f3f46"/>
              <rect x="10" y="8" width="12" height="5" rx="1.5" fill="#71717a"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Bedrock Staffing</h1>
          <p className="text-sm text-zinc-500 mt-1">Create a recruiter account</p>
        </div>

        <form action={handleSubmit} className="space-y-4 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="you@company.com"
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-8 text-center text-[11px] text-zinc-400">
          Powered by Bedrock Staffing
        </p>
      </div>
    </div>
  );
}
