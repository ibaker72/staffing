import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile, UserRole } from "@/types/database";

export type AuthUser = {
  id: string;
  email: string;
  profile: UserProfile;
};

/**
 * Get the current authenticated user with their profile.
 * Returns null if not authenticated or profile doesn't exist.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const profile = profileData as UserProfile | null;
    if (profileError || !profile) return null;

    return {
      id: user.id,
      email: user.email ?? profile.email,
      profile,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Require a specific role (or any of the allowed roles).
 * Redirects to /login if not authenticated, /unauthorized if wrong role.
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth();

  if (!user.profile.is_active) {
    redirect("/login?error=account_disabled");
  }

  if (!allowedRoles.includes(user.profile.role)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Require internal user (admin or recruiter).
 */
export async function requireInternal(): Promise<AuthUser> {
  return requireRole("admin", "recruiter");
}

/**
 * Require admin role.
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole("admin");
}

/**
 * Check if user is internal (admin or recruiter) without redirecting.
 */
export function isInternal(user: AuthUser): boolean {
  return user.profile.role === "admin" || user.profile.role === "recruiter";
}

/**
 * Check if user is admin without redirecting.
 */
export function isAdmin(user: AuthUser): boolean {
  return user.profile.role === "admin";
}

/**
 * Get the company IDs a client user has access to.
 */
export async function getClientCompanyIds(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("client_users")
      .select("company_id")
      .eq("user_id", userId);

    if (error) return [];
    return (data ?? []).map((row) => row.company_id);
  } catch {
    return [];
  }
}
