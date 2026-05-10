import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  body: string;
  type?: 'INFO' | 'WARNING' | 'URGENT';
  data?: any;
}

export interface NotificationFilter {
  isRead?: boolean;
  type?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Bildirim oluştur
   */
  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        type: dto.type || 'INFO',
        data: dto.data || null,
      },
    });
  }

  /**
   * Kullanıcının tüm bildirimlerini listele
   */
  async findAll(userId: string, filter?: NotificationFilter) {
    const where: any = { userId };

    if (filter?.isRead !== undefined) {
      where.isRead = filter.isRead;
    }
    if (filter?.type) {
      where.type = filter.type;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Okunmamış bildirim sayısı
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Bildirimi okundu işaretle
   */
  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Bildirim bulunamadı');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Tüm bildirimleri okundu işaretle
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Bildirim sil
   */
  async delete(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Bildirim bulunamadı');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Bina veya org için toplu bildirim gönder
   */
  async createBulk(organizationId: string, buildingId: string | null, dto: {
    title: string;
    body: string;
    type?: 'INFO' | 'WARNING' | 'URGENT';
  }) {
    // Get all users in organization or building
    const whereClause: any = { organizationId };
    if (buildingId) {
      whereClause.buildingId = buildingId;
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    // Create notifications for all users
    const notifications = users.map((user: { id: string }) => ({
      userId: user.id,
      title: dto.title,
      body: dto.body,
      type: dto.type || 'INFO',
    }));

    return this.prisma.notification.createMany({
      data: notifications,
    });
  }
}