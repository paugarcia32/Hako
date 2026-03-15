import type { ID, Timestamp } from './common';

export type User = Timestamp & {
  id: ID;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};
