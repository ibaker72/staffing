import type { Metadata } from "next";
import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const message = params.message;
  const errorParam = params.error;
  const redirectTo = params.redirect;

  async function signInWithRedirect(formData: FormData) {
    "use server";
    if (redirectTo) {
      formData.set("redirect", redirectTo);
    }
    await signIn(formData);
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
          <p className="text-sm text-zinc-500 mt-1">Sign in to your account</p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {errorParam === "account_disabled" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Your account has been disabled. Contact an administrator.
          </div>
        )}
        {errorParam === "server_config" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            The server is not configured correctly. Check that Supabase environment variables are set.
          </div>
        )}
        {errorParam === "profile_missing" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Your user profile could not be loaded. Please try again or contact an administrator.
          </div>
        )}
        {errorParam === "invalid_credentials" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Invalid email or password.
          </div>
        )}
        {errorParam === "auth_unavailable" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Authentication service is temporarily unavailable. Please try again.
          </div>
        )}

        <form action={signInWithRedirect} className="space-y-4 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
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
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Need an account?{" "}
          <Link href="/signup" className="text-zinc-900 font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <p className="mt-8 text-center text-[11px] text-zinc-400">
          Powered by Bedrock Staffing
        </p>
      </div>
    </div>
  );
}
