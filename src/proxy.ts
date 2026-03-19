import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/invite/accept", "/portal", "/marketing"];
// Routes only accessible to internal users (admin, recruiter)
const internalRoutes = ["/dashboard", "/companies", "/candidates", "/jobs", "/placements", "/tasks", "/admin", "/settings", "/views", "/reporting", "/import"];

function normalizeSupabaseUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  return `https://${rawUrl}`;
}

function inferSafeRoleFromMetadata(meta: unknown): "client" | "recruiter" {
  if (!meta || typeof meta !== "object") return "recruiter";
  const maybeRole = (meta as { role?: unknown }).role;
  return maybeRole === "client" ? "client" : "recruiter";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Let public assets and API routes through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in proxy");

    if (isPublicRoute) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "server_config");
    return NextResponse.redirect(url);
  }

  try {

  // Create a response we can modify
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Helper: create a redirect that preserves session cookies from supabaseResponse.
  // This is CRITICAL — after getUser() refreshes the session, the old token is
  // invalidated. If we return a plain NextResponse.redirect(), the refreshed
  // cookies are lost and the next request fails with a stale session.
  function redirectWithCookies(url: URL): NextResponse {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  // Refresh session — IMPORTANT: must call getUser() not getSession()
  // Wrap in try/catch so network errors don't throw into the catch-all
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch (e) {
    console.error("Proxy: getUser() threw", e);
    // user stays null — treat as unauthenticated
  }

  // Helper: safely fetch a user profile without throwing
  async function getProfile(currentUser: {
    id: string;
    email?: string | null;
    user_metadata?: unknown;
  }) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role, is_active")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (error) {
        console.error("Proxy: profile query error", error.message);
        return null;
      }
      if (data) {
        return data as { role: string; is_active: boolean };
      }

      const inferredRole = inferSafeRoleFromMetadata(currentUser.user_metadata);
      const { data: inserted, error: insertError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            id: currentUser.id,
            email: currentUser.email ?? "",
            full_name: (currentUser.user_metadata as { full_name?: string } | null)?.full_name ?? "",
            role: inferredRole,
            is_active: true,
          },
          { onConflict: "id" }
        )
        .select("role, is_active")
        .maybeSingle();

      if (insertError) {
        console.error("Proxy: profile self-heal failed", insertError.message);
        return null;
      }

      return inserted as { role: string; is_active: boolean } | null;
    } catch (e) {
      console.error("Proxy: profile query threw", e);
      return null;
    }
  }

  // Root redirect
  if (pathname === "/") {
    if (user) {
      const profile = await getProfile(user);
      if (!profile) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "profile_missing");
        return redirectWithCookies(url);
      }
      const url = request.nextUrl.clone();
      url.pathname = profile.role === "client" ? "/client" : "/dashboard";
      return redirectWithCookies(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithCookies(url);
  }

  // Public routes: allow unauthenticated access
  if (isPublicRoute) {
    // If logged in and trying to access /login, redirect away
    if (pathname === "/login" && user) {
      const profile = await getProfile(user);
      if (!profile) {
        // Profile is missing but user is authenticated — let them see the login page
        // so they can see the error and try again. Don't redirect in a loop.
        return supabaseResponse;
      }
      const url = request.nextUrl.clone();
      url.pathname = profile.role === "client" ? "/client" : "/dashboard";
      return redirectWithCookies(url);
    }
    return supabaseResponse;
  }

  // All other routes require authentication
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return redirectWithCookies(url);
  }

  // Fetch profile once for all remaining checks
  const profile = await getProfile(user);

  // If we couldn't fetch the profile at all (DB error or missing record),
  // degrade gracefully for the user rather than hard-redirecting to login
  // which creates a loop. Allow through and let the page-level auth handle it.
  if (!profile) {
    console.error(`Proxy: no profile found for user ${user.id}, allowing through to page-level auth`);
    return supabaseResponse;
  }

  // Check if account is active
  if (!profile.is_active) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "account_disabled");
    return redirectWithCookies(url);
  }

  // Check if route requires internal access
  const isInternalRoute = internalRoutes.some((route) => pathname.startsWith(route));
  if (isInternalRoute && profile.role === "client") {
    const url = request.nextUrl.clone();
    url.pathname = "/client";
    return redirectWithCookies(url);
  }

  // Admin routes
  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return redirectWithCookies(url);
  }

  return supabaseResponse;
  } catch (error) {
    console.error("Proxy runtime failure", error);

    if (isPublicRoute) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "auth_unavailable");
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
