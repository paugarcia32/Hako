import type { GroupBy } from '@/components/filter-bar';
import { useState } from 'react';

export function useItemGrouping() {
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleGroupByChange(v: GroupBy) {
    setGroupBy(v);
    setCollapsedGroups(new Set());
  }

  return { groupBy, setGroupBy: handleGroupByChange, collapsedGroups, toggleGroup };
}
