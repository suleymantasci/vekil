import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreateAssetDto {
  buildingId: string;
  name: string;
  type: 'elevator' | 'generator' | 'pool' | 'hvac' | 'other';
  brand?: string;
  model?: string;
  serialNo?: string;
  warrantyEnd?: Date;
  installDate?: Date;
  location?: string;
  notes?: string;
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Demirbaş oluştur
   */
  async create(organizationId: string, dto: CreateAssetDto) {
    return this.prisma.asset.create({
      data: {
        buildingId: dto.buildingId,
        name: dto.name,
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        serialNo: dto.serialNo,
        warrantyEnd: dto.warrantyEnd,
        installDate: dto.installDate,
        location: dto.location,
        notes: dto.notes,
      },
      include: {
        building: { select: { id: true, name: true } },
        workOrders: { select: { id: true, status: true, priority: true } },
      },
    });
  }

  /**
   * Tüm demirbaşları listele
   */
  async findAll(organizationId: string, buildingId?: string) {
    return this.prisma.asset.findMany({
      where: {
        building: { organizationId },
        buildingId: buildingId || undefined,
        isActive: true,
      },
      include: {
        building: { select: { id: true, name: true } },
        _count: { select: { workOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Tek demirbaş getir
   */
  async findOne(organizationId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        id,
        building: { organizationId },
      },
      include: {
        building: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Demirbaş bulunamadı');
    }

    return asset;
  }

  /**
   * Demirbaş güncelle
   */
  async update(organizationId: string, id: string, dto: Partial<CreateAssetDto>) {
    await this.findOne(organizationId, id);

    return this.prisma.asset.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Demirbaş sil (soft delete)
   */
  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.asset.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Garanti durumu kontrolü
   */
  async getWarrantyStatus(organizationId: string, id: string) {
    const asset = await this.findOne(organizationId, id);

    if (!asset.warrantyEnd) {
      return { ...asset, warrantyStatus: 'unknown' as const, daysRemaining: null };
    }

    const now = new Date();
    const warrantyEnd = new Date(asset.warrantyEnd);
    const daysRemaining = Math.floor((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let warrantyStatus: 'active' | 'expiring_soon' | 'expired' = 'active';
    if (daysRemaining < 0) {
      warrantyStatus = 'expired';
    } else if (daysRemaining <= 30) {
      warrantyStatus = 'expiring_soon';
    }

    return {
      ...asset,
      warrantyStatus,
      daysRemaining,
    };
  }
}