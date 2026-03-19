import { trpc } from '@/lib/trpc';

export function useItemActions() {
  const utils = trpc.useUtils();

  const archive = trpc.items.archive.useMutation({
    onSuccess: () => {
      void utils.items.list.invalidate();
      void utils.items.count.refetch();
    },
  });

  const unarchive = trpc.items.unarchive.useMutation({
    onSuccess: () => {
      void utils.items.list.invalidate();
      void utils.items.count.refetch();
    },
  });

  const deleteItem = trpc.items.delete.useMutation({
    onSuccess: () => {
      void utils.items.list.invalidate();
      void utils.items.count.refetch();
    },
  });

  return { archive, unarchive, deleteItem };
}
