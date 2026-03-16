import type { CreateItemInput } from '@inkbox/types';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateItemInput) {
    return this.prisma.item.create({
      data: {
        userId,
        url: input.url,
      },
    });
  }

  async findAll(userId: string, { limit, cursor }: { limit: number; cursor?: string | undefined }) {
    const items = await this.prisma.item.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return { items, nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null };
  }

  async findOne(userId: string, id: string) {
    return this.prisma.item.findFirst({
      where: { id, userId },
    });
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.item.update({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async toggleFavorite(userId: string, id: string, isFavorite: boolean) {
    return this.prisma.item.update({
      where: { id, userId },
      data: { isFavorite },
    });
  }

  async delete(userId: string, id: string) {
    return this.prisma.item.delete({
      where: { id, userId },
    });
  }
}
