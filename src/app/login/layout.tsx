export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-auto bg-zinc-50">{children}</div>;
}
