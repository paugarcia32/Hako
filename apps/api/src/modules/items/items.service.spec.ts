import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { truncateAll } from '../../test/helpers/db';
import { createTestItem, createTestUser } from '../../test/helpers/factories';
import { prisma } from '../../test/helpers/prisma';
import { closeTestModule, getTestModule } from '../../test/helpers/create-test-module';
import { ItemsService } from './items.service';

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    const module = await getTestModule();
    service = module.get(ItemsService);
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await closeTestModule();
  });

  describe('create', () => {
    it('creates an item with correct userId and url', async () => {
      const user = await createTestUser();
      const item = await service.create(user.id, { url: 'https://example.com/article' });

      expect(item.userId).toBe(user.id);
      expect(item.url).toBe('https://example.com/article');
    });

    it('defaults type to "link" and status to "pending"', async () => {
      const user = await createTestUser();
      const item = await service.create(user.id, { url: 'https://example.com' });

      expect(item.type).toBe('link');
      expect(item.status).toBe('pending');
    });
  });

  describe('findAll', () => {
    it('returns empty items array for a user with no items', async () => {
      const user = await createTestUser();
      const result = await service.findAll(user.id, { limit: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it('returns items ordered by createdAt descending', async () => {
      const user = await createTestUser();
      const first = await createTestItem(user.id);
      await new Promise((r) => setTimeout(r, 10)); // ensure different timestamps
      const second = await createTestItem(user.id);

      const result = await service.findAll(user.id, { limit: 10 });

      expect(result.items[0]?.id).toBe(second.id);
      expect(result.items[1]?.id).toBe(first.id);
    });

    it('respects the limit parameter', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 5; i++) await createTestItem(user.id);

      const result = await service.findAll(user.id, { limit: 3 });

      expect(result.items).toHaveLength(3);
    });

    it('does not return items belonging to another user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestItem(user2.id);

      const result = await service.findAll(user1.id, { limit: 10 });

      expect(result.items).toHaveLength(0);
    });

    it('returns nextCursor when more items exist', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 5; i++) await createTestItem(user.id);

      const result = await service.findAll(user.id, { limit: 3 });

      expect(result.nextCursor).not.toBeNull();
    });

    it('returns nextCursor as null when all items fit in one page', async () => {
      const user = await createTestUser();
      await createTestItem(user.id);
      await createTestItem(user.id);

      const result = await service.findAll(user.id, { limit: 10 });

      expect(result.nextCursor).toBeNull();
    });

    it('cursor pagination returns next page without duplicates', async () => {
      const user = await createTestUser();
      for (let i = 0; i < 5; i++) await createTestItem(user.id);

      const page1 = await service.findAll(user.id, { limit: 3 });
      expect(page1.nextCursor).not.toBeNull();

      const page2 = await service.findAll(user.id, {
        limit: 3,
        cursor: page1.nextCursor!,
      });

      const page1Ids = new Set(page1.items.map((i) => i.id));
      for (const item of page2.items) {
        expect(page1Ids.has(item.id)).toBe(false);
      }
    });
  });

  describe('findOne', () => {
    it('returns the item when userId matches', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);

      const found = await service.findOne(user.id, item.id);

      expect(found?.id).toBe(item.id);
    });

    it('returns null when item belongs to a different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const item = await createTestItem(user2.id);

      const found = await service.findOne(user1.id, item.id);

      expect(found).toBeNull();
    });

    it('returns null for a non-existent id', async () => {
      const user = await createTestUser();
      const found = await service.findOne(user.id, 'non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('sets isRead to true and sets a readAt timestamp', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);

      const updated = await service.markAsRead(user.id, item.id);

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).not.toBeNull();
    });

    it('throws when item belongs to a different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const item = await createTestItem(user2.id);

      await expect(service.markAsRead(user1.id, item.id)).rejects.toThrow();
    });
  });

  describe('toggleFavorite', () => {
    it('sets isFavorite to true', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);

      const updated = await service.toggleFavorite(user.id, item.id, true);

      expect(updated.isFavorite).toBe(true);
    });

    it('sets isFavorite back to false', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id, { isFavorite: true });

      const updated = await service.toggleFavorite(user.id, item.id, false);

      expect(updated.isFavorite).toBe(false);
    });

    it('throws when item belongs to a different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const item = await createTestItem(user2.id);

      await expect(service.toggleFavorite(user1.id, item.id, true)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes item from the database', async () => {
      const user = await createTestUser();
      const item = await createTestItem(user.id);

      await service.delete(user.id, item.id);

      const found = await service.findOne(user.id, item.id);
      expect(found).toBeNull();
    });

    it('throws when item belongs to a different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const item = await createTestItem(user2.id);

      await expect(service.delete(user1.id, item.id)).rejects.toThrow();
    });
  });
});
