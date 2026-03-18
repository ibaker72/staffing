import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-lg font-bold text-zinc-900 mb-2">Access Denied</h1>
        <p className="text-sm text-zinc-500 mb-4">
          You don&apos;t have permission to access this page.
        </p>
        <LinkButton href="/dashboard" variant="secondary">
          Back to Dashboard
        </LinkButton>
      </Card>
    </div>
  );
}
