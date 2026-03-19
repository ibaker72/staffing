import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/invite/accept", "/portal", "/marketing"];
// Routes only accessible to internal users (admin, recruiter)
const internalRoutes = ["/dashboard", "/companies", "/candidates", "/jobs", "/placements", "/tasks", "/admin", "/settings", "/views", "/reporting", "/import"];

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
  async function getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role, is_active")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.error("Proxy: profile query error", error.message);
        return null;
      }
      return data as { role: string; is_active: boolean } | null;
    } catch (e) {
      console.error("Proxy: profile query threw", e);
      return null;
    }
  }

  // Root redirect
  if (pathname === "/") {
    if (user) {
      const profile = await getProfile(user.id);
      if (profile?.role === "client") {
        const url = request.nextUrl.clone();
        url.pathname = "/client";
        return NextResponse.redirect(url);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Public routes: allow unauthenticated access
  if (isPublicRoute) {
    // If logged in and trying to access /login, redirect away
    if (pathname === "/login" && user) {
      const profile = await getProfile(user.id);
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === "client" ? "/client" : "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // All other routes require authentication
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Fetch profile once for all remaining checks
  const profile = await getProfile(user.id);

  // If we couldn't fetch the profile at all (DB error or missing record),
  // fail closed — redirect to login rather than allowing unverified access
  if (!profile) {
    console.error(`Proxy: no profile found for user ${user.id}, redirecting to login`);
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "profile_missing");
    return NextResponse.redirect(url);
  }

  // Check if account is active
  if (!profile.is_active) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "account_disabled");
    return NextResponse.redirect(url);
  }

  // Check if route requires internal access
  const isInternalRoute = internalRoutes.some((route) => pathname.startsWith(route));
  if (isInternalRoute && profile.role === "client") {
    const url = request.nextUrl.clone();
    url.pathname = "/client";
    return NextResponse.redirect(url);
  }

  // Admin routes
  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
