import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 
  | 'DUES_INCOME'        // Aidat gelirleri
  | 'PAYMENT_INCOME'      // Gecikme faizi gelirleri
  | 'OTHER_INCOME'        // Diğer gelirler
  | 'MAINTENANCE_EXPENSE' // Bakım/onarım giderleri
  | 'UTILITY_EXPENSE'     // Elektrik, su, doğalgaz
  | 'PERSONNEL_EXPENSE'   // Personel giderleri
  | 'INSURANCE_EXPENSE'   // Sigorta giderleri
  | 'OTHER_EXPENSE';      // Diğer giderler

export interface CreateTransactionDto {
  organizationId: string;
  buildingId?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  referenceNo?: string;
  transactionDate: Date;
}

export interface TransactionFilter {
  buildingId?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new income/expense transaction
   * SECURITY: All transactions are tied to organization for RLS
   */
  async createTransaction(dto: CreateTransactionDto) {
    return this.prisma.incomeExpense.create({
      data: {
        organizationId: dto.organizationId,
        buildingId: dto.buildingId || null,
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        referenceNo: dto.referenceNo || null,
        transactionDate: dto.transactionDate,
      },
    });
  }

  /**
   * List transactions with optional filters
   */
  async findAll(organizationId: string, filter?: TransactionFilter) {
    const where: any = { organizationId };

    if (filter?.buildingId) where.buildingId = filter.buildingId;
    if (filter?.type) where.type = filter.type;
    if (filter?.category) where.category = filter.category;
    if (filter?.startDate || filter?.endDate) {
      where.transactionDate = {};
      if (filter?.startDate) where.transactionDate.gte = filter.startDate;
      if (filter?.endDate) where.transactionDate.lte = filter.endDate;
    }

    return this.prisma.incomeExpense.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  /**
   * Get single transaction
   */
  async findOne(organizationId: string, id: string) {
    const transaction = await this.prisma.incomeExpense.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('İşlem bulunamadı');
    }

    return transaction;
  }

  /**
   * Delete transaction (soft delete via cascade if needed, hard delete for now)
   */
  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.incomeExpense.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Get accounting summary/balance
   */
  async getSummary(organizationId: string, buildingId?: string, startDate?: Date, endDate?: Date) {
    const where: any = { organizationId };
    if (buildingId) where.buildingId = buildingId;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = startDate;
      if (endDate) where.transactionDate.lte = endDate;
    }

    const transactions = await this.prisma.incomeExpense.findMany({ where });

    const income = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const expense = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Group by category
    const byCategory = transactions.reduce((acc: Record<string, { income: number; expense: number }>, t: any) => {
      const key = t.category;
      if (!acc[key]) {
        acc[key] = { income: 0, expense: 0 };
      }
      if (t.type === 'INCOME') acc[key].income += t.amount;
      else acc[key].expense += t.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      byCategory,
      transactionCount: transactions.length,
    };
  }

  /**
   * Get monthly report for a given period
   */
  async getMonthlyReport(organizationId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.getSummary(organizationId, undefined, startDate, endDate);
  }

  /**
   * Create or update budget
   */
  async upsertBudget(organizationId: string, dto: {
    buildingId?: string;
    year: number;
    month?: number;
    category: TransactionCategory;
    plannedAmount: number;
    actualAmount?: number;
  }) {
    const where: any = {
      organizationId,
      year: dto.year,
      category: dto.category,
    };
    if (dto.buildingId) where.buildingId = dto.buildingId;
    if (dto.month) where.month = dto.month;

    return this.prisma.budget.upsert({
      where: { organizationId_year_category_buildingId_month: {
        organizationId,
        year: dto.year,
        category: dto.category,
        buildingId: dto.buildingId || null,
        month: dto.month || null,
      }},
      create: {
        organizationId,
        buildingId: dto.buildingId || null,
        year: dto.year,
        month: dto.month || null,
        category: dto.category,
        plannedAmount: dto.plannedAmount,
        actualAmount: dto.actualAmount || 0,
      },
      update: {
        plannedAmount: dto.plannedAmount,
        actualAmount: dto.actualAmount,
      },
    });
  }

  /**
   * List budgets
   */
  async findBudgets(organizationId: string, year?: number) {
    const where: any = { organizationId };
    if (year) where.year = year;

    return this.prisma.budget.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}