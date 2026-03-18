import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/invite/accept", "/portal"];
// Routes only accessible to internal users (admin, recruiter)
const internalRoutes = ["/dashboard", "/companies", "/candidates", "/jobs", "/placements", "/tasks", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public assets and API routes through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Create a response we can modify
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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
  const { data: { user } } = await supabase.auth.getUser();

  // Check if current path matches public routes
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Root redirect
  if (pathname === "/") {
    if (user) {
      // Check role to redirect appropriately
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

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
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

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

  // Check if route requires internal access
  const isInternalRoute = internalRoutes.some((route) => pathname.startsWith(route));

  if (isInternalRoute) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_disabled");
      return NextResponse.redirect(url);
    }

    if (profile?.role === "client") {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }
  }

  // Client-only routes
  if (pathname.startsWith("/client")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_disabled");
      return NextResponse.redirect(url);
    }

    // Internal users can also access client views (for admin/testing)
    // No additional restriction needed
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
