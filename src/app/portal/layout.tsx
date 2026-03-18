export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // Override parent layout — full-width, no sidebar padding
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-zinc-50">
      {children}
    </div>
  );
}
