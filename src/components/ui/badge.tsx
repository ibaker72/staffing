const variants: Record<string, string> = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant] ?? variants.default}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: string }> = {
    // Candidate
    new: { label: "New", variant: "info" },
    contacted: { label: "Contacted", variant: "purple" },
    interviewing: { label: "Interviewing", variant: "warning" },
    placed: { label: "Placed", variant: "success" },
    rejected: { label: "Rejected", variant: "danger" },
    // Job
    open: { label: "Open", variant: "success" },
    closed: { label: "Closed", variant: "default" },
    // Placement
    pending: { label: "Pending", variant: "warning" },
    hired: { label: "Hired", variant: "info" },
    paid: { label: "Paid", variant: "success" },
  };

  const entry = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={entry.variant as keyof typeof variants}>{entry.label}</Badge>;
}
