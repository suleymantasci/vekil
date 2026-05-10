import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreateWorkOrderDto {
  buildingId: string;
  assetId?: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'electrical' | 'plumbing' | 'structural' | 'other';
  location?: string;
  photos?: string[];
}

export interface WorkOrderFilter {
  buildingId?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
}

@Injectable()
export class WorkOrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * İş emri oluştur (sakin veya yönetici tarafından)
   */
  async create(userId: string, organizationId: string, dto: CreateWorkOrderDto) {
    return this.prisma.workOrder.create({
      data: {
        reportedBy: userId,
        organizationId: organizationId,
        buildingId: dto.buildingId,
        title: dto.title,
        description: dto.description,
        assetId: dto.assetId || null,
        priority: dto.priority || 'medium',
        category: dto.category || 'other',
        location: dto.location || null,
        photos: dto.photos || [],
        status: 'open',
      },
      include: {
        asset: { include: { building: true } },
        reporter: { select: { id: true, firstName: true, lastName: true, phone: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });
  }

  /**
   * Tüm iş emirlerini listele (bina bazlı filtre)
   */
  async findAll(organizationId: string, filter?: WorkOrderFilter) {
    const where: any = {
      reporter: { organizationId },
    };

    if (filter?.buildingId) {
      where.asset = { buildingId: filter.buildingId };
    }
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.priority) {
      where.priority = filter.priority;
    }
    if (filter?.assignedTo) {
      where.assignedTo = filter.assignedTo;
    }

    return this.prisma.workOrder.findMany({
      where,
      include: {
        asset: { include: { building: true } },
        reporter: { select: { id: true, firstName: true, lastName: true, apartmentId: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Tek iş emri getir
   */
  async findOne(organizationId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        id,
        reporter: { organizationId },
      },
      include: {
        asset: { include: { building: true } },
        reporter: { select: { id: true, firstName: true, lastName: true, phone: true, apartmentId: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (!workOrder) {
      throw new NotFoundException('İş emri bulunamadı');
    }

    return workOrder;
  }

  /**
   * İş emri atama
   */
  async assign(organizationId: string, id: string, assignedToId: string) {
    await this.findOne(organizationId, id); // Verify exists

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        assignedTo: assignedToId,
        status: 'in_progress',
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * İş emri güncelle (durum, öncelik, çözüm)
   */
  async update(organizationId: string, id: string, data: {
    status?: string;
    priority?: string;
    resolution?: string;
  }) {
    await this.findOne(organizationId, id);

    const updateData: any = { ...data };
    if (data.status === 'resolved' || data.status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * İş emrine fotoğraf ekle
   */
  async addPhoto(organizationId: string, id: string, photoUrl: string) {
    await this.findOne(organizationId, id);

    const workOrder = await this.prisma.workOrder.findUnique({ where: { id } });
    return this.prisma.workOrder.update({
      where: { id },
      data: {
        photos: [...(workOrder?.photos || []), photoUrl],
      },
    });
  }

  /**
   * Bina bazlı iş emri istatistikleri
   */
  async getStatsByBuilding(buildingId: string) {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.workOrder.count({ where: { asset: { buildingId } } }),
      this.prisma.workOrder.count({ where: { asset: { buildingId }, status: 'open' } }),
      this.prisma.workOrder.count({ where: { asset: { buildingId }, status: 'in_progress' } }),
      this.prisma.workOrder.count({ where: { asset: { buildingId }, status: 'resolved' } }),
      this.prisma.workOrder.count({ where: { asset: { buildingId }, status: 'closed' } }),
    ]);

    return { total, open, inProgress, resolved, closed };
  }
}