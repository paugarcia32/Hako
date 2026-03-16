import type { ID, Timestamp } from './common';

export type ContentType = 'article' | 'youtube' | 'tweet' | 'link';

export type ItemStatus = 'pending' | 'processing' | 'done' | 'failed';

export type Item = Timestamp & {
  id: ID;
  userId: ID;
  url: string;
  type: ContentType;
  status: ItemStatus;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  content: string | null;
  transcript: string | null;
  isRead: boolean;
  isFavorite: boolean;
  readAt: string | null;
  tags?: string[];
};

export type CreateItemInput = {
  url: string;
};
