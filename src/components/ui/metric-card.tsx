import { Card } from "./card";

export function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      )}
    </Card>
  );
}
