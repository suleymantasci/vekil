import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface TahakkukRuleDto {
  buildingId?: string;
  name: string;
  chargeType: 'MONTHLY_FEE' | 'CONSUMPTION' | 'DUES' | 'PENALTY' | 'OTHER';
  calculationType: 'fixed' | 'area_m2' | 'share_ratio';
  amount: number;
  dueDay: number;
  description?: string;
}

export interface GenerateChargesInput {
  organizationId: string;
  buildingId?: string;
  period: string; // "2026-05", "2026-Q1"
  rules: TahakkukRuleDto[];
}

@Injectable()
export class TahakkukService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tüm aidat kurallarını getir
   */
  async getRules(organizationId: string, buildingId?: string) {
    return this.prisma.tahakkukRule.findMany({
      where: {
        organizationId,
        buildingId: buildingId || undefined,
        isActive: true,
      },
      include: { building: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Yeni aidat kuralı oluştur
   */
  async createRule(organizationId: string, dto: TahakkukRuleDto) {
    return this.prisma.tahakkukRule.create({
      data: {
        organizationId,
        buildingId: dto.buildingId || null,
        name: dto.name,
        chargeType: dto.chargeType as any,
        calculationType: dto.calculationType,
        amount: dto.amount,
        dueDay: dto.dueDay,
        description: dto.description,
      },
    });
  }

  /**
   * Aidat kuralı güncelle
   */
  async updateRule(organizationId: string, ruleId: string, dto: Partial<TahakkukRuleDto>) {
    return this.prisma.tahakkukRule.update({
      where: { id: ruleId, organizationId },
      data: {
        buildingId: dto.buildingId !== undefined ? dto.buildingId || null : undefined,
        name: dto.name,
        chargeType: dto.chargeType as any,
        calculationType: dto.calculationType,
        amount: dto.amount,
        dueDay: dto.dueDay,
        description: dto.description,
      },
    });
  }

  /**
   * Aidat kuralı sil (soft delete - isActive = false)
   */
  async deleteRule(organizationId: string, ruleId: string) {
    return this.prisma.tahakkukRule.update({
      where: { id: ruleId, organizationId },
      data: { isActive: false },
    });
  }

  /**
   * Tahakkuk oluştur (borçlandırma)
   * Her daire için aidat hesapla ve Charge oluştur
   */
  async generateCharges(input: GenerateChargesInput) {
    const { organizationId, buildingId, period, rules } = input;

    // Dönemden tarih hesapla
    const [year, month] = period.split('-').map(Number);
    const dueDate = new Date(year, month - 1, 1);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(rules[0]?.dueDay || 5);

    // Tüm daireleri al (buildingId verilmişse sadece o bina)
    const apartments = await this.prisma.apartment.findMany({
      where: {
        building: {
          organizationId,
          id: buildingId || undefined,
          isActive: true,
        },
        isActive: true,
      },
      include: { building: true, users: true },
    });

    const createdCharges: any[] = [];

    for (const apartment of apartments) {
      for (const rule of rules) {
        // Bina bazlı kural kontrolü
        if (rule.buildingId && rule.buildingId !== apartment.buildingId) continue;

        // Tutari hesapla
        let amount = rule.amount;
        if (rule.calculationType === 'area_m2') {
          amount = rule.amount * apartment.areaM2;
        } else if (rule.calculationType === 'share_ratio') {
          amount = rule.amount * apartment.shareRatio;
        }

        // Daha önce aynı dönem için bu kural ile charge oluşturulmuş mu?
        const existing = await this.prisma.charge.findFirst({
          where: {
            apartmentId: apartment.id,
            period,
            description: rule.name,
            chargeType: rule.chargeType as any,
          },
        });

        if (existing) continue; // Skip if already charged

        const primaryUser = apartment.users[0];

        createdCharges.push({
          apartmentId: apartment.id,
          userId: primaryUser?.id || null,
          period,
          description: rule.name,
          chargeType: rule.chargeType as any,
          amount,
          paidAmount: 0,
          status: 'PENDING',
          dueDate,
        });
      }
    }

    // Batch insert
    if (createdCharges.length > 0) {
      await this.prisma.charge.createMany({
        data: createdCharges.map((c) => ({
          ...c,
          organizationId,
          dueDate,
        })),
      });
    }

    return {
      period,
      apartmentsProcessed: apartments.length,
      rulesApplied: rules.length,
      chargesCreated: createdCharges.length,
    };
  }

  /**
   * Dönem aidatlarını listele
   */
  async getChargesByPeriod(organizationId: string, period: string, buildingId?: string) {
    return this.prisma.charge.findMany({
      where: {
        organizationId,
        period,
        apartment: buildingId ? { buildingId } : undefined,
      },
      include: {
        apartment: { include: { building: true } },
        
        payments: true,
        lateFees: true,
      },
      orderBy: { apartment: { number: 'asc' } },
    });
  }

  /**
   * Daire borç durumunu getir
   */
  async getApartmentBalance(apartmentId: string) {
    const charges = await this.prisma.charge.findMany({
      where: { apartmentId, status: { not: 'CANCELLED' } },
      include: { lateFees: true, payments: true },
    });

    const totalDebt = charges.reduce((sum: number, c: any) => sum + c.amount, 0);
    const totalPaid = charges.reduce((sum: number, c: any) => {
      const paid = c.payments.reduce((s: number, p: any) => s + p.amount, 0);
      return sum + paid;
    }, 0);
    const totalLateFee = charges.reduce(
      (sum: number, c: any) => sum + c.lateFees.filter((f: any) => !f.isPaid).reduce((s: number, f: any) => s + f.amount, 0),
      0
    );

    return {
      apartmentId,
      totalDebt,
      totalPaid,
      balance: totalDebt - totalPaid, // Kalan borç
      totalLateFee,
      charges: charges.map((c: any) => ({
        id: c.id,
        description: c.description,
        amount: c.amount,
        status: c.status,
        dueDate: c.dueDate,
        paidAmount: c.payments.reduce((s: number, p: any) => s + p.amount, 0),
        lateFee: c.lateFees.filter((f: any) => !f.isPaid).reduce((s: number, f: any) => s + f.amount, 0),
      })),
    };
  }
}