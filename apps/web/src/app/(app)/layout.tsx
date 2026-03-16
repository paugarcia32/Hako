import { Sidebar } from '@/components/sidebar';
import { TrpcProvider } from '@/components/trpc-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <div className="flex h-screen bg-stone-50 dark:bg-stone-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </TrpcProvider>
  );
}
