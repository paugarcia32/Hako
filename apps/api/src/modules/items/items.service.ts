import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateItemInput } from '@inkbox/types';

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

  async findAll(userId: string) {
    return this.prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
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
