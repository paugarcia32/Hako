import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { closeTestModule } from '../../test/helpers/create-test-module';
import { truncateAll } from '../../test/helpers/db';
import { createTestItem, createTestUser } from '../../test/helpers/factories';
import { prisma } from '../../test/helpers/prisma';
import { getCaller } from '../../test/helpers/trpc-caller';

describe('items tRPC router', () => {
  beforeEach(async () => {
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await closeTestModule();
  });

  describe('auth enforcement', () => {
    it('items.list rejects unauthenticated caller with UNAUTHORIZED', async () => {
      const caller = await getCaller();
      await expect(caller.items.list({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('items.create rejects unauthenticated caller with UNAUTHORIZED', async () => {
      const caller = await getCaller();
      await expect(caller.items.create({ url: 'https://example.com' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('items.markAsRead rejects unauthenticated caller with UNAUTHORIZED', async () => {
      const caller = await getCaller();
      await expect(caller.items.markAsRead({ id: 'some-id' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('items.toggleFavorite rejects unauthenticated caller with UNAUTHORIZED', async () => {
      const caller = await getCaller();
      await expect(
        caller.items.toggleFavorite({ id: 'some-id', isFavorite: true }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('items.delete rejects unauthenticated caller with UNAUTHORIZED', async () => {
      const caller = await getCaller();
      await expect(caller.items.delete({ id: 'some-id' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('items.list', () => {
    it('returns empty items and null nextCursor for a new user', async () => {
      const user = await createTestUser();
      const caller = await getCaller(user.id);

      const result = await caller.items.list({});

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it('returns only items belonging to the authenticated user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestItem(user2.id);
      const caller = await getCaller(user1.id);

      const result = await caller.items.list({});

      expect(result.items).toHaveLength(0);
    });

    it('uses default limit of 50', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 3; i++) await createTestItem(user.id);
      const caller = await getCaller(user.id);

      // No limit provided — uses default of 50
      const result = await caller.items.list({});

      expect(result.items).toHaveLength(3);
    });

    it('respects explicit limit', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 5; i++) await createTestItem(user.id);
      const caller = await getCaller(user.id);

      const result = await caller.items.list({ limit: 2 });

      expect(result.items).toHaveLength(2);
    });

    it('returns nextCursor when more items exist', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 5; i++) await createTestItem(user.id);
      const caller = await getCaller(user.id);

      const result = await caller.items.list({ limit: 3 });

      expect(result.nextCursor).not.toBeNull();
    });

    it('cursor pagination returns next page correctly', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 5; i++) await createTestItem(user.id);
      const caller = await getCaller(user.id);

      const page1 = await caller.items.list({ limit: 3 });
      const page2 = await caller.items.list({ limit: 3, cursor: page1.nextCursor! });

      const page1Ids = new Set(page1.items.map((i) => i.id));
      for (const item of page2.items) {
        expect(page1Ids.has(item.id)).toBe(false);
      }
    });

    it('Zod rejects limit below 1', async () => {
      const user = await createTestUser();
      const caller = await getCaller(user.id);

      await expect(caller.items.list({ limit: 0 })).rejects.toThrow();
    });

    it('Zod rejects limit above 100', async () => {
      const user = await createTestUser();
      const caller = await getCaller(user.id);

      await expect(caller.items.list({ limit: 101 })).rejects.toThrow();
    });
  });

  describe('items.create', () => {
    it('creates an item and returns it with the correct userId', async () => {
      const user = await createTestUser();
      const caller = await getCaller(user.id);

      const item = await caller.items.create({ url: 'https://example.com/new-item' });

      expect(item.userId).toBe(user.id);
      expect(item.url).toBe('https://example.com/new-item');
    });

    it('Zod rejects a non-URL string', async () => {
      const user = await createTestUser();
      const caller = await getCaller(user.id);

      await expect(caller.items.create({ url: 'not-a-url' })).rejects.toThrow();
    });

    it('Zod rejects a missing url', async () => {
      const user = await createTestUser();
      const caller = await getCaller(user.id);

      // @ts-expect-error — intentionally passing invalid input
      await expect(caller.items.create({})).rejects.toThrow();
    });
  });

  describe('items.markAsRead', () => {
    it('marks the item as read', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);
      const caller = await getCaller(user.id);

      const updated = await caller.items.markAsRead({ id: item.id });

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).not.toBeNull();
    });

    it('throws when item belongs to a different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const item = await createTestItem(user2.id);
      const caller = await getCaller(user1.id);

      await expect(caller.items.markAsRead({ id: item.id })).rejects.toThrow();
    });
  });

  describe('items.toggleFavorite', () => {
    it('sets isFavorite to true', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);
      const caller = await getCaller(user.id);

      const updated = await caller.items.toggleFavorite({ id: item.id, isFavorite: true });

      expect(updated.isFavorite).toBe(true);
    });

    it('sets isFavorite back to false', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id, { isFavorite: true });
      const caller = await getCaller(user.id);

      const updated = await caller.items.toggleFavorite({ id: item.id, isFavorite: false });

      expect(updated.isFavorite).toBe(false);
    });

    it('Zod rejects missing isFavorite', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);
      const caller = await getCaller(user.id);

      // @ts-expect-error — intentionally passing invalid input
      await expect(caller.items.toggleFavorite({ id: item.id })).rejects.toThrow();
    });
  });

  describe('items.delete', () => {
    it('deletes the item, which no longer appears in list', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);
      const caller = await getCaller(user.id);

      await caller.items.delete({ id: item.id });

      const result = await caller.items.list({});
      expect(result.items.find((i) => i.id === item.id)).toBeUndefined();
    });

    it('throws when item belongs to a different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const item = await createTestItem(user2.id);
      const caller = await getCaller(user1.id);

      await expect(caller.items.delete({ id: item.id })).rejects.toThrow();
    });
  });
});
