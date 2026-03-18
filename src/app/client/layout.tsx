import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientNav } from "@/components/client-nav";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50">
      <ClientNav user={user} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
