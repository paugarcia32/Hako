import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { closeTestModule, getTestModule } from '../../test/helpers/create-test-module';
import { truncateAll } from '../../test/helpers/db';
import { createTestCollection, createTestItem, createTestUser } from '../../test/helpers/factories';
import { prisma } from '../../test/helpers/prisma';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await getTestModule();
    service = module.get(UsersService);
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await closeTestModule();
  });

  describe('updateProfile', () => {
    it('updates the user name and returns the updated user', async () => {
      const user = await createTestUser({ name: 'Old Name' });

      const updated = await service.updateProfile(user.id, 'New Name');

      expect(updated.name).toBe('New Name');
      expect(updated.id).toBe(user.id);
    });

    it('persists the updated name in the database', async () => {
      const user = await createTestUser({ name: 'Old Name' });

      await service.updateProfile(user.id, 'Persisted Name');

      const fromDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(fromDb?.name).toBe('Persisted Name');
    });

    it('throws when userId does not exist', async () => {
      await expect(service.updateProfile('non-existent-id', 'Name')).rejects.toThrow();
    });
  });

  describe('deleteAccount', () => {
    it('removes the user from the database', async () => {
      const user = await createTestUser();

      await service.deleteAccount(user.id);

      const fromDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(fromDb).toBeNull();
    });

    it('deletes all items belonging to the user', async () => {
      const user = await createTestUser();
      await createTestItem(user.id);
      await createTestItem(user.id);

      await service.deleteAccount(user.id);

      const items = await prisma.item.findMany({ where: { userId: user.id } });
      expect(items).toHaveLength(0);
    });

    it('deletes all collections belonging to the user', async () => {
      const user = await createTestUser();
      await createTestCollection(user.id);
      await createTestCollection(user.id);

      await service.deleteAccount(user.id);

      const collections = await prisma.collection.findMany({ where: { userId: user.id } });
      expect(collections).toHaveLength(0);
    });

    it('does not delete items belonging to other users', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestItem(user2.id);

      await service.deleteAccount(user1.id);

      const items = await prisma.item.findMany({ where: { userId: user2.id } });
      expect(items).toHaveLength(1);
    });

    it('throws when userId does not exist', async () => {
      await expect(service.deleteAccount('non-existent-id')).rejects.toThrow();
    });
  });
});
