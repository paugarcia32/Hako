import { TopBar } from '@/components/top-bar';
import { TrpcProvider } from '@/components/trpc-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <div className="flex min-h-dvh flex-col bg-stone-50 dark:bg-stone-900">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </TrpcProvider>
  );
}
