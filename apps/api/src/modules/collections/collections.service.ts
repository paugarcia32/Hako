import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, { limit, cursor }: { limit: number; cursor?: string | undefined }) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = collections.length > limit;
    if (hasMore) collections.pop();
    return { collections, nextCursor: hasMore ? (collections[collections.length - 1]?.id ?? null) : null };
  }

  async create(userId: string, data: { name: string; description?: string | undefined }) {
    return this.prisma.collection.create({
      data: { userId, name: data.name, description: data.description ?? null },
    });
  }

  async addItem(userId: string, collectionId: string, itemId: string) {
    await this.prisma.collection.findFirstOrThrow({
      where: { id: collectionId, userId },
    });
    return this.prisma.collectionItem.create({
      data: { collectionId, itemId },
    });
  }

  async findByShareToken(token: string) {
    return this.prisma.collection.findUnique({
      where: { shareToken: token, isPublic: true },
      include: { items: { include: { item: true } } },
    });
  }
}
