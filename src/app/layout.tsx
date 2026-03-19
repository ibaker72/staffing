import type { Metadata, Viewport } from "next";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bedrock Staffing",
    template: "%s | Bedrock Staffing",
  },
  description: "Staffing and recruiting management platform by Bedrock Staffing",
  applicationName: "Bedrock Staffing",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
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
