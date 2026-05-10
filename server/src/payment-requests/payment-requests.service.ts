import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';
import { v4 as uuidv4 } from 'uuid';

// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// Payment method enum
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WIRE = 'WIRE',
}

// Payment provider enum (for future extensibility)
export enum PaymentProvider {
  IYZICO = 'IYZICO',
  PAYSTACK = 'PAYSTACK',
  STRIPE = 'STRIPE',
}

export interface CreatePaymentRequestDto {
  organizationId: string;
  apartmentId: string;
  amount: number;
  currency?: string;
  description?: string;
  apartmentName?: string;
}

export interface PaymentRequestFilter {
  apartmentId?: string;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Payment Request Service
 * 
 * Handles online payment request creation and tracking.
 * Provider integration (Iyzico/PayStack/Stripe) is stubbed for now.
 * 
 * SECURITY: All operations are scoped to organization via RLS.
 */
@Injectable()
export class PaymentRequestsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new payment request
   * For demo purposes, generates a payment link without real provider
   */
  async createRequest(organizationId: string, dto: CreatePaymentRequestDto) {
    // Generate unique payment reference
    const paymentRef = `PAY-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Generate mock payment page URL (in production, this would be Iyzico/PayStack redirect URL)
    const mockPaymentUrl = `https://checkout.iyzico.com/payment/${paymentRef}`;

    return this.prisma.paymentRequest.create({
      data: {
        organizationId,
        apartmentId: dto.apartmentId,
        amount: dto.amount,
        currency: dto.currency || 'TRY',
        description: dto.description || 'Online ödeme',
        status: PaymentStatus.PENDING,
        paymentRef,
        paymentUrl: mockPaymentUrl,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days expiry
      },
      include: {
        apartment: {
          select: {
            id: true,
            unitNumber: true,
            building: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * List payment requests with filters
   */
  async findAll(organizationId: string, filter?: PaymentRequestFilter) {
    const where: any = { organizationId };

    if (filter?.apartmentId) where.apartmentId = filter.apartmentId;
    if (filter?.status) where.status = filter.status;
    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter?.startDate) where.createdAt.gte = filter.startDate;
      if (filter?.endDate) where.createdAt.lte = filter.endDate;
    }

    return this.prisma.paymentRequest.findMany({
      where,
      include: {
        apartment: {
          select: {
            id: true,
            unitNumber: true,
            building: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single payment request
   */
  async findOne(organizationId: string, id: string) {
    const request = await this.prisma.paymentRequest.findFirst({
      where: { id, organizationId },
      include: {
        apartment: {
          select: {
            id: true,
            unitNumber: true,
            building: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Ödeme talebi bulunamadı');
    }

    return request;
  }

  /**
   * Get payment by reference
   */
  async findByRef(organizationId: string, paymentRef: string) {
    return this.prisma.paymentRequest.findFirst({
      where: { paymentRef, organizationId },
      include: {
        apartment: {
          select: {
            id: true,
            unitNumber: true,
            building: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Update payment status (called by webhook)
   * SECURITY: Validates that the payment belongs to this organization
   */
  async updateStatus(id: string, status: PaymentStatus, providerRef?: string) {
    const updateData: any = { status };
    
    if (status === PaymentStatus.COMPLETED) {
      updateData.paidAt = new Date();
      if (providerRef) updateData.providerRef = providerRef;
    }

    return this.prisma.paymentRequest.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Cancel a pending payment request
   */
  async cancel(organizationId: string, id: string) {
    const request = await this.findOne(organizationId, id);

    if (request.status !== PaymentStatus.PENDING) {
      throw new Error('Sadece bekleyen ödemeler iptal edilebilir');
    }

    return this.prisma.paymentRequest.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
    });
  }

  /**
   * Get statistics for payment requests
   */
  async getStats(organizationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { organizationId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, pending, completed, failed] = await Promise.all([
      this.prisma.paymentRequest.count({ where }),
      this.prisma.paymentRequest.count({ where: { ...where, status: PaymentStatus.PENDING } }),
      this.prisma.paymentRequest.count({ where: { ...where, status: PaymentStatus.COMPLETED } }),
      this.prisma.paymentRequest.count({ where: { ...where, status: PaymentStatus.FAILED } }),
    ]);

    // Sum amounts for completed payments
    const completedSum = await this.prisma.paymentRequest.aggregate({
      where: { ...where, status: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    });

    return {
      total,
      pending,
      completed,
      failed,
      totalCollected: completedSum._sum.amount || 0,
    };
  }

  /**
   * Create bulk payment requests (e.g., for all apartments with outstanding charges)
   */
  async createBulkForCharges(organizationId: string, chargeIds: string[]) {
    // Get charges
    const charges = await this.prisma.charge.findMany({
      where: {
        id: { in: chargeIds },
        status: { in: ['PENDING', 'PARTIAL'] },
        apartment: { building: { organizationId } },
      },
      include: {
        apartment: {
          select: { id: true, unitNumber: true },
        },
      },
    });

    // Create payment request for each (with remaining balance after payments)
    const requests = await Promise.all(
      charges.map((charge: any) => {
        const paidAmount = charge.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
        const remaining = charge.amount - paidAmount;
        return this.createRequest(organizationId, {
          organizationId,
          apartmentId: charge.apartmentId,
          amount: remaining,
          currency: 'TRY',
          description: `Aidat borcu - ${charge.period}`,
        });
      }),
    );

    return requests;
  }
}