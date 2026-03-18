import type { Metadata } from "next";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { ToastProvider } from "@/components/ui/toast";
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
        <ToastProvider>
          <SidebarWrapper>
            {children}
          </SidebarWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
