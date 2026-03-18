import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "./sidebar";

/**
 * Server component that fetches the current user and conditionally renders the sidebar.
 * Auth pages (login, signup, invite, portal, unauthorized) use their own overlay layout
 * so the sidebar still renders underneath but is hidden.
 */
export async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // If no user, render children without sidebar chrome
  if (!user) {
    return (
      <>
        <main>
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </>
    );
  }

  // Client-role users get their own layout (rendered by /client/layout.tsx)
  if (user.profile.role === "client") {
    return <>{children}</>;
  }

  // Internal users get the standard sidebar layout
  return (
    <>
      <Sidebar user={user} />
      <main className="pb-20 lg:pb-0 lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
