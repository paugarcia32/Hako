export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>{/* Sidebar */}</nav>
      <main>{children}</main>
    </div>
  );
}
