import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreatePurchaseRequestDto {
  buildingId: string;
  title: string;
  description: string;
  category: 'construction' | 'cleaning' | 'security' | 'maintenance' | 'other';
  estimatedAmount?: number;
  supplierId?: string;
  deadline?: Date;
}

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreatePurchaseRequestDto) {
    return this.prisma.purchaseRequest.create({
      data: {
        organizationId,
        buildingId: dto.buildingId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        estimatedAmount: dto.estimatedAmount,
        supplierId: dto.supplierId,
        deadline: dto.deadline,
        status: 'DRAFT',
      },
      include: {
        building: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(organizationId: string, buildingId?: string, status?: string) {
    return this.prisma.purchaseRequest.findMany({
      where: {
        organizationId,
        buildingId: buildingId || undefined,
        status: status || undefined,
      },
      include: {
        building: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
    if (!pr) throw new NotFoundException('Satın alma talebi bulunamadı.');
    return pr;
  }

  async updateStatus(organizationId: string, id: string, status: string, awardedAmount?: number) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id, organizationId },
    });
    if (!pr) throw new NotFoundException('Talep bulunamadı.');

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status,
        awardedAmount: awardedAmount || pr.awardedAmount,
      },
    });
  }

  async addSupplierQuote(
    organizationId: string,
    id: string,
    dto: { supplierId: string; amount: number; notes?: string },
  ) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id, organizationId },
    });
    if (!pr) throw new NotFoundException('Talep bulunamadı.');

    // Store quote in notes temporarily
    const existingNotes = pr.notes || '';
    const newQuote = `\n[TEKLİF] ${dto.supplierId}: ${dto.amount} ₺ ${dto.notes || ''}`;
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { notes: existingNotes + newQuote },
    });
  }
}
