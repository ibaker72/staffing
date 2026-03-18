import { ReactNode } from "react";
import { LinkButton } from "./button";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. This may be a temporary issue — try refreshing the page.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/50 px-6 py-16 text-center">
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-sm text-red-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function NotFoundState({
  title = "Not found",
  description = "The item you're looking for doesn't exist or has been removed.",
  backHref = "/dashboard",
  backLabel = "Go to Dashboard",
}: {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-16 text-center">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
      <div className="mt-4">
        <LinkButton href={backHref} variant="secondary">
          {backLabel}
        </LinkButton>
      </div>
    </div>
  );
}
