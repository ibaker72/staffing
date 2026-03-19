import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bedrock Staffing — Recruiting Software Built for Growing Firms",
  description:
    "Bedrock Staffing is the all-in-one recruiting platform for staffing firms, trade recruiters, and growing agencies. Manage candidates, jobs, clients, and placements from one system.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
