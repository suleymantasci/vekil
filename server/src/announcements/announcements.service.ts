import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreateAnnouncementDto {
  organizationId: string;
  buildingId?: string;
  title: string;
  body: string;
  type?: 'INFO' | 'WARNING' | 'URGENT' | 'EVENT';
  isPublished?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface AnnouncementFilter {
  buildingId?: string;
  type?: string;
  isPublished?: boolean;
}

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Duyuru oluştur
   */
  async create(dto: CreateAnnouncementDto) {
    const data: any = {
      organizationId: dto.organizationId,
      title: dto.title,
      body: dto.body,
      type: dto.type || 'INFO',
      isPublished: dto.isPublished || false,
    };

    if (dto.buildingId) data.buildingId = dto.buildingId;
    if (dto.startDate) data.startDate = dto.startDate;
    if (dto.endDate) data.endDate = dto.endDate;

    return this.prisma.announcement.create({ data });
  }

  /**
   * Tüm duyuruları listele (org veya bina bazlı)
   */
  async findAll(organizationId: string, filter?: AnnouncementFilter) {
    const where: any = { organizationId };

    if (filter?.buildingId) {
      where.buildingId = filter.buildingId;
    }
    if (filter?.type) {
      where.type = filter.type;
    }
    if (filter?.isPublished !== undefined) {
      where.isPublished = filter.isPublished;
    }

    return this.prisma.announcement.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Tek duyuru getir
   */
  async findOne(organizationId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Duyuru bulunamadı');
    }

    return announcement;
  }

  /**
   * Duyuru güncelle
   */
  async update(organizationId: string, id: string, data: {
    title?: string;
    body?: string;
    type?: string;
    isPublished?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    await this.findOne(organizationId, id);

    return this.prisma.announcement.update({
      where: { id },
      data,
    });
  }

  /**
   * Duyuru yayınla
   */
  async publish(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.announcement.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  /**
   * Duyuru sil
   */
  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Aktif duyuruları getir (tarih aralığında ve yayınlanmış)
   */
  async getActive(organizationId: string, buildingId?: string) {
    const now = new Date();
    const where: any = {
      organizationId,
      isPublished: true,
    };

    if (buildingId) {
      where.buildingId = buildingId;
    }

    where.OR = [
      { endDate: null },
      { endDate: { gte: now } },
    ];

    return this.prisma.announcement.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}