import type { ID, Timestamp } from './common';
import type { Item } from './item';

export type Collection = Timestamp & {
  id: ID;
  userId: ID;
  name: string;
  description: string | null;
  shareToken: string | null;
  isPublic: boolean;
  itemCount: number;
};

export type CollectionWithItems = Collection & {
  items: Item[];
};
