import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';
import { v4 as uuidv4 } from 'uuid';

// Visitor status enum
export enum VisitorStatus {
  PENDING = 'PENDING',       // Invitation created, not yet arrived
  CHECKED_IN = 'CHECKED_IN', // Visitor arrived
  CHECKED_OUT = 'CHECKED_OUT', // Visitor left
  EXPIRED = 'EXPIRED',       // Invitation expired
}

export interface CreateVisitorDto {
  organizationId: string;
  buildingId: string;
  apartmentId?: string;
  visitorName: string;
  visitorPhone?: string;
  purpose: string;
  expectedArrival: Date;
  validUntil: Date;
}

export interface VisitorFilter {
  buildingId?: string;
  status?: VisitorStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Visitor Management Service
 * 
 * Handles visitor invitations, QR code generation, and access logging.
 * SECURITY: All operations are scoped to organization via RLS.
 */
@Injectable()
export class VisitorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new visitor invitation
   * Generates a unique access code and QR code URL
   */
  async createInvitation(organizationId: string, dto: CreateVisitorDto) {
    // Generate unique access code (6 characters)
    const accessCode = this.generateAccessCode();
    
    // Generate QR code URL - in production, this would generate actual QR
    // For now, we use a placeholder that encodes the access code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      JSON.stringify({
        org: organizationId,
        bld: dto.buildingId,
        code: accessCode,
      })
    )}`;

    // Create visitor record
    const visitor = await this.prisma.visitor.create({
      data: {
        organizationId,
        buildingId: dto.buildingId,
        apartmentId: dto.apartmentId || null,
        visitorName: dto.visitorName,
        visitorPhone: dto.visitorPhone || null,
        purpose: dto.purpose,
        accessCode,
        qrCodeUrl,
        status: VisitorStatus.PENDING,
        expectedArrival: dto.expectedArrival,
        validUntil: dto.validUntil,
      },
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
    });

    return visitor;
  }

  /**
   * Check in a visitor using access code
   */
  async checkIn(organizationId: string, accessCode: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: {
        accessCode,
        organizationId,
        status: VisitorStatus.PENDING,
        validUntil: { gte: new Date() },
      },
    });

    if (!visitor) {
      throw new NotFoundException('Geçersiz veya süresi dolmuş erişim kodu');
    }

    // Update visitor status
    const updated = await this.prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        status: VisitorStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
    });

    // Log access event
    await this.logAccess(organizationId, visitor.id, 'CHECK_IN');

    return updated;
  }

  /**
   * Check out a visitor
   */
  async checkOut(organizationId: string, visitorId: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id: visitorId, organizationId },
    });

    if (!visitor) {
      throw new NotFoundException('Ziyaretçi bulunamadı');
    }

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: {
        status: VisitorStatus.CHECKED_OUT,
        checkedOutAt: new Date(),
      },
    });

    // Log access event
    await this.logAccess(organizationId, visitorId, 'CHECK_OUT');

    return updated;
  }

  /**
   * List visitors with optional filters
   */
  async findAll(organizationId: string, filter?: VisitorFilter) {
    const where: any = { organizationId };

    if (filter?.buildingId) where.buildingId = filter.buildingId;
    if (filter?.status) where.status = filter.status;
    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter?.startDate) where.createdAt.gte = filter.startDate;
      if (filter?.endDate) where.createdAt.lte = filter.endDate;
    }

    return this.prisma.visitor.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get visitor by ID
   */
  async findOne(organizationId: string, id: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
    });

    if (!visitor) {
      throw new NotFoundException('Ziyaretçi bulunamadı');
    }

    return visitor;
  }

  /**
   * Get access logs for a visitor
   */
  async getAccessLogs(organizationId: string, visitorId: string) {
    // Verify visitor belongs to organization
    await this.findOne(organizationId, visitorId);

    return this.prisma.accessLog.findMany({
      where: { visitorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancel visitor invitation
   */
  async cancel(organizationId: string, id: string) {
    const visitor = await this.findOne(organizationId, id);

    if (visitor.status !== VisitorStatus.PENDING) {
      throw new Error('Sadece bekleyen ziyaretler iptal edilebilir');
    }

    return this.prisma.visitor.update({
      where: { id },
      data: { status: VisitorStatus.EXPIRED },
    });
  }

  /**
   * Get visitor statistics
   */
  async getStats(organizationId: string, buildingId?: string) {
    const where: any = { organizationId };
    if (buildingId) where.buildingId = buildingId;

    const [total, checkedIn, checkedOut, expired] = await Promise.all([
      this.prisma.visitor.count({ where }),
      this.prisma.visitor.count({ where: { ...where, status: VisitorStatus.CHECKED_IN } }),
      this.prisma.visitor.count({ where: { ...where, status: VisitorStatus.CHECKED_OUT } }),
      this.prisma.visitor.count({ where: { ...where, status: VisitorStatus.EXPIRED } }),
    ]);

    return { total, checkedIn, checkedOut, expired };
  }

  /**
   * Generate a random 6-character access code
   * Uses uppercase letters and numbers for readability
   */
  private generateAccessCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Log an access event
   */
  private async logAccess(organizationId: string, visitorId: string, action: string) {
    await this.prisma.accessLog.create({
      data: {
        organizationId,
        visitorId,
        action,
        timestamp: new Date(),
      },
    });
  }
}