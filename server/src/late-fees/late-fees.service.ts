import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

/**
 * KMK Madde 20 — Gecikme Tazminatı
 *
 * Borç ödenmezse aylık %5 gecikme faizi işletilir.
 * Bu servis günlük bazda faiz hesaplar.
 *
 * Not: Türkiye'de 3095 s.K. ile getirilen yasal faiz oranı
 * yıllık %9, aylık ≈ %0.75'dir. Ancak apartman aidatları için
 * Kat Mülkiyeti Kanunu'nun 20. maddesi uyarınca
 * "ödemeyenlere %5 gecikme tazminatı" uygulanır.
 */
@Injectable()
export class LateFeeService {
  // KMK Madde 20: Aylık %5 gecikme tazminatı
  private readonly MONTHLY_LATE_FEE_RATE = 0.05; // 5% per month

  constructor(private prisma: PrismaService) {}

  /**
   * Günlük gecikme faizi oranı (aylık / 30)
   */
  get dailyRate(): number {
    return this.MONTHLY_LATE_FEE_RATE / 30;
  }

  /**
   * Gecikme faizi hesapla
   * @param amount Borç tutarı
   * @param daysLate Gecikme gün sayısı
   * @returns Faiz tutarı
   */
  calculate(amount: number, daysLate: number): number {
    if (daysLate <= 0) return 0;
    // Basit faiz: Ana para × Gün sayısı × Günlük oran
    return Math.round(amount * daysLate * this.dailyRate * 100) / 100;
  }

  /**
   * Tüm ödenmemiş borçlara gecikme faizi uygula
   * @param organizationId Kurum ID
   * @param period Opsiyonel dönem filtrelesi ("2026-05")
   */
  async calculateAllLateFees(organizationId: string, period?: string) {
    // Vadesi geçmiş, ödenmemiş borçları bul
    const overdueCharges = await this.prisma.charge.findMany({
      where: {
        organizationId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() }, // Vadesi geçmiş
        ...(period ? { period } : {}),
      },
      include: {
        lateFees: { where: { isPaid: false } }, // Ödenmemiş faizler
      },
    });

    const results = [];

    for (const charge of overdueCharges) {
      const today = new Date();
      const dueDate = new Date(charge.dueDate);
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLate <= 0) continue;

      // Kalan borç
      const paidAmount = (charge.payments as any[])?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
      const remainingDebt = charge.amount - paidAmount;

      if (remainingDebt <= 0) continue;

      // Mevcut ödenmemiş faizi hesapla
      const existingLateFee = (charge.lateFees as any[])
        .filter((f: any) => !f.isPaid)
        .reduce((s: number, f: any) => s + f.amount, 0);

      // Yeni faiz hesapla (sadece yeni günler için)
      const newLateFeeAmount = this.calculate(remainingDebt, daysLate);

      if (newLateFeeAmount <= existingLateFee) continue;

      const diff = newLateFeeAmount - existingLateFee;

      // Veritabanına kaydet
      const lateFee = await this.prisma.lateFee.create({
        data: {
          chargeId: charge.id,
          amount: diff,
          rate: this.MONTHLY_LATE_FEE_RATE,
        },
      });

      results.push({
        chargeId: charge.id,
        description: charge.description,
        remainingDebt,
        daysLate,
        previousLateFee: existingLateFee,
        newLateFee: diff,
        totalLateFee: newLateFeeAmount,
      });
    }

    return {
      calculatedAt: new Date(),
      totalChargesProcessed: overdueCharges.length,
      newLateFeesCreated: results.length,
      details: results,
    };
  }

  /**
   * Belirli bir dönemin gecikme faizlerini getir
   */
  async getLateFeesByPeriod(organizationId: string, period?: string) {
    const charges = await this.prisma.charge.findMany({
      where: {
        organizationId,
        ...(period ? { period } : {}),
        lateFees: { some: {} }, // En az bir gecikme faizi olanlar
      },
      include: {
        apartment: { include: { building: true } },
        lateFees: {
          where: { isPaid: false },
          orderBy: { calculatedAt: 'desc' },
        },
        payments: true,
      },
    });

    return charges.map((c: any) => {
      const paidAmount = c.payments.reduce((s: number, p: any) => s + p.amount, 0);
      const remainingDebt = c.amount - paidAmount;
      const unpaidLateFee = c.lateFees
        .filter((f: any) => !f.isPaid)
        .reduce((s: number, f: any) => s + f.amount, 0);

      return {
        chargeId: c.id,
        apartment: {
          id: c.apartment.id,
          number: c.apartment.number,
          building: c.apartment.building.name,
        },
        description: c.description,
        period: c.period,
        amount: c.amount,
        remainingDebt,
        unpaidLateFee,
        totalDebt: remainingDebt + unpaidLateFee,
        dueDate: c.dueDate,
        lateFeeCount: c.lateFees.length,
      };
    });
  }

  /**
   * Gecikme faizini ödendi olarak işaretle
   */
  async markLateFeeAsPaid(lateFeeId: string) {
    return this.prisma.lateFee.update({
      where: { id: lateFeeId },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }
}