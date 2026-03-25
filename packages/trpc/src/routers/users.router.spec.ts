import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { truncateAll } from '../../test/helpers/db';
import { createTestCollection, createTestItem, createTestUser } from '../../test/helpers/factories';
import { prisma } from '../../test/helpers/prisma';
import { getCaller } from '../../test/helpers/trpc-caller';

describe('users tRPC router', () => {
  beforeEach(async () => {
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('auth enforcement', () => {
    it('users.updateProfile rejects unauthenticated caller with UNAUTHORIZED', async () => {
      const caller = getCaller();
      await expect(caller.users.updateProfile({ name: 'Test' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('users.deleteAccount rejects unauthenticated caller with UNAUTHORIZED', async () => {
      const caller = getCaller();
      await expect(caller.users.deleteAccount()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('users.updateProfile', () => {
    it('updates and returns the new name', async () => {
      const user = await createTestUser({ name: 'Original' });
      const caller = getCaller(user.id);

      const result = await caller.users.updateProfile({ name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('Zod rejects an empty name', async () => {
      const user = await createTestUser();
      const caller = getCaller(user.id);

      await expect(caller.users.updateProfile({ name: '' })).rejects.toThrow();
    });

    it('Zod rejects a name longer than 100 characters', async () => {
      const user = await createTestUser();
      const caller = getCaller(user.id);

      await expect(caller.users.updateProfile({ name: 'a'.repeat(101) })).rejects.toThrow();
    });
  });

  describe('users.deleteAccount', () => {
    it('deletes the user so they no longer exist in the database', async () => {
      const user = await createTestUser();
      const caller = getCaller(user.id);

      await caller.users.deleteAccount();

      const fromDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(fromDb).toBeNull();
    });

    it('deletes all items and collections of the user', async () => {
      const user = await createTestUser();
      await createTestItem(user.id);
      await createTestItem(user.id);
      await createTestCollection(user.id);
      const caller = getCaller(user.id);

      await caller.users.deleteAccount();

      const items = await prisma.item.findMany({ where: { userId: user.id } });
      const collections = await prisma.collection.findMany({ where: { userId: user.id } });
      expect(items).toHaveLength(0);
      expect(collections).toHaveLength(0);
    });

    it('does not affect data belonging to other users', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestItem(user2.id);
      await createTestCollection(user2.id);
      const caller = getCaller(user1.id);

      await caller.users.deleteAccount();

      const items = await prisma.item.findMany({ where: { userId: user2.id } });
      const collections = await prisma.collection.findMany({ where: { userId: user2.id } });
      expect(items).toHaveLength(1);
      expect(collections).toHaveLength(1);
    });
  });
});
