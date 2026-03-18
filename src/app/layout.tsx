import type { Metadata } from "next";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Staffing Engine",
  description: "Internal staffing and recruiting management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-zinc-50">
        <SidebarWrapper>
          {children}
        </SidebarWrapper>
      </body>
    </html>
  );
}
