import { KeyboardEditPortal, KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help';
import { TopBar } from '@/components/top-bar';
import { TrpcProvider } from '@/components/trpc-provider';
import { KeyboardNavProvider } from '@/contexts/keyboard-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <KeyboardNavProvider>
        <div className="flex min-h-dvh flex-col bg-stone-50 dark:bg-stone-900">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <KeyboardShortcutsHelp />
        <KeyboardEditPortal />
      </KeyboardNavProvider>
    </TrpcProvider>
  );
}
