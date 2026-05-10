import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private accountingService: AccountingService) {}

  /**
   * Create transaction
   * POST /accounting/transactions
   */
  @Post('transactions')
  async createTransaction(@Body() dto: any) {
    return this.accountingService.createTransaction(dto);
  }

  /**
   * List transactions
   * GET /accounting/transactions?organizationId=xxx&type=INCOME&startDate=xxx
   */
  @Get('transactions')
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter: any = {};
    if (buildingId) filter.buildingId = buildingId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);

    return this.accountingService.findAll(organizationId, filter);
  }

  /**
   * Get transaction
   * GET /accounting/transactions/:id?organizationId=xxx
   */
  @Get('transactions/:id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.accountingService.findOne(organizationId, id);
  }

  /**
   * Delete transaction
   * DELETE /accounting/transactions/:id?organizationId=xxx
   */
  @Delete('transactions/:id')
  async delete(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.accountingService.delete(organizationId, id);
  }

  /**
   * Get accounting summary
   * GET /accounting/summary?organizationId=xxx&buildingId=xxx&startDate=xxx
   */
  @Get('summary')
  async getSummary(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getSummary(
      organizationId,
      buildingId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get monthly report
   * GET /accounting/monthly-report?organizationId=xxx&year=2026&month=5
   */
  @Get('monthly-report')
  async getMonthlyReport(
    @Query('organizationId') organizationId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.accountingService.getMonthlyReport(
      organizationId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  /**
   * Create or update budget
   * POST /accounting/budgets
   */
  @Post('budgets')
  async upsertBudget(@Body() dto: any) {
    return this.accountingService.upsertBudget(dto.organizationId, dto);
  }

  /**
   * List budgets
   * GET /accounting/budgets?organizationId=xxx&year=2026
   */
  @Get('budgets')
  async findBudgets(
    @Query('organizationId') organizationId: string,
    @Query('year') year?: string,
  ) {
    return this.accountingService.findBudgets(organizationId, year ? parseInt(year, 10) : undefined);
  }
}