import type { PrismaClient } from '@prisma/client';

export async function truncateAll(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      collection_items,
      item_tags,
      tags,
      collections,
      items,
      sessions,
      accounts,
      verifications,
      users
    RESTART IDENTITY CASCADE
  `);
}
