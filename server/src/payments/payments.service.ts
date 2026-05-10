import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ödeme oluştur
   * @param organizationId Kurum ID
   * @param apartmentId Daire ID
   * @param userId Kullanıcı ID
   * @param amount Tutar
   * @param chargeId Opsiyonel borç ID ( Diret ödeme değilse null)
   * @param paymentMethod Ödeme yöntemi
   * @param reference Referans / açıklama
   */
  async createPayment(params: {
    organizationId: string;
    apartmentId: string;
    userId?: string;
    chargeId?: string;
    amount: number;
    paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DIGITAL_WALLET';
    reference?: string;
  }) {
    const { organizationId, apartmentId, userId, chargeId, amount, paymentMethod, reference } = params;

    // Transaction ile hem ödemeyi hem de charge'ı güncelle
    return this.prisma.$transaction(async (tx: any) => {
      // Ödeme oluştur
      const payment = await tx.payment.create({
        data: {
          organizationId,
          apartmentId,
          userId: userId || null,
          chargeId: chargeId || null,
          amount,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          reference: reference || null,
          paidAt: new Date(),
        },
      });

      // Eğer chargeId verilmişse, o charge'ın durumunu güncelle
      if (chargeId) {
        const charge = await tx.charge.findUnique({ where: { id: chargeId } });
        if (charge) {
          const newPaidAmount = charge.paidAmount + amount;
          const newStatus = newPaidAmount >= charge.amount
            ? 'PAID'
            : newPaidAmount > 0
              ? 'PARTIAL'
              : 'PENDING';

          await tx.charge.update({
            where: { id: chargeId },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });
        }
      } else {
        // Genel ödeme — tüm ödenmemiş borçlara dağıt
        const unpaidCharges = await tx.charge.findMany({
          where: {
            organizationId,
            apartmentId,
            status: { in: ['PENDING', 'PARTIAL'] },
          },
          orderBy: { dueDate: 'asc' }, // Vadesi en eski olana öncelik
        });

        let remaining = amount;
        for (const charge of unpaidCharges) {
          if (remaining <= 0) break;

          const deficit = charge.amount - charge.paidAmount;
          const toPay = Math.min(remaining, deficit);

          const newPaidAmount = charge.paidAmount + toPay;
          const newStatus = newPaidAmount >= charge.amount ? 'PAID' : 'PARTIAL';

          await tx.charge.update({
            where: { id: charge.id },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });

          remaining -= toPay;
        }
      }

      return payment;
    });
  }

  /**
   * Apartman ödemelerini getir
   */
  async getPaymentsByApartment(apartmentId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { apartmentId },
        include: {
          charge: { select: { description: true, period: true, amount: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { apartmentId } }),
    ]);

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Kurumun tüm ödemelerini getir
   */
  async getPayments(organizationId: string, period?: string, page = 1, limit = 50) {
    const where: any = { organizationId };
    if (period) {
      where.charge = { period };
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          apartment: { include: { building: true } },
          charge: { select: { description: true, period: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Dönem özetini getir
   */
  async getPeriodSummary(organizationId: string, period: string) {
    const charges = await this.prisma.charge.findMany({
      where: { organizationId, period },
      include: { payments: true, lateFees: { where: { isPaid: false } } },
    });

    const summary = {
      period,
      totalCharges: charges.length,
      totalAmount: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      totalLateFee: 0,
      byStatus: { PENDING: 0, PARTIAL: 0, PAID: 0, CANCELLED: 0 },
      byType: {} as Record<string, { count: number; amount: number; paid: number }>,
    };

    for (const charge of charges) {
      const paid = charge.payments.reduce((s: number, p: any) => s + p.amount, 0);
      const lateFee = charge.lateFees.reduce((s: number, f: any) => s + f.amount, 0);

      summary.totalAmount += charge.amount;
      summary.totalPaid += paid;
      summary.totalLateFee += lateFee;
      summary.byStatus[charge.status as keyof typeof summary.byStatus]++;

      if (!summary.byType[charge.chargeType]) {
        summary.byType[charge.chargeType] = { count: 0, amount: 0, paid: 0 };
      }
      summary.byType[charge.chargeType].count++;
      summary.byType[charge.chargeType].amount += charge.amount;
      summary.byType[charge.chargeType].paid += paid;
    }

    summary.totalUnpaid = summary.totalAmount - summary.totalPaid;

    return summary;
  }
}