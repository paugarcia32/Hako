import { trpc } from '@/lib/trpc';

export function useItemActions() {
  const utils = trpc.useUtils();

  const archive = trpc.items.archive.useMutation({
    onSuccess: () => void utils.items.list.invalidate(),
  });

  const unarchive = trpc.items.unarchive.useMutation({
    onSuccess: () => void utils.items.list.invalidate(),
  });

  const deleteItem = trpc.items.delete.useMutation({
    onSuccess: () => void utils.items.list.invalidate(),
  });

  return { archive, unarchive, deleteItem };
}
