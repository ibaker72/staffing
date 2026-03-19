import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10">
            <rect x="4" y="20" width="24" height="5" rx="1.5" fill="#18181b"/>
            <rect x="7" y="14" width="18" height="5" rx="1.5" fill="#3f3f46"/>
            <rect x="10" y="8" width="12" height="5" rx="1.5" fill="#71717a"/>
          </svg>
        </div>
        <Card className="text-center">
          <h1 className="text-lg font-bold text-zinc-900 mb-2">Access Denied</h1>
          <p className="text-sm text-zinc-500 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <LinkButton href="/dashboard" variant="secondary">
            Back to Dashboard
          </LinkButton>
        </Card>
      </div>
    </div>
  );
}
