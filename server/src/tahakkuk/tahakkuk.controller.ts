import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TahakkukService } from './tahakkuk.service';
import { LateFeeService } from '../late-fees/late-fees.service';

@Controller('tahakkuk')
@UseGuards(AuthGuard('jwt'))
export class TahakkukController {
  constructor(
    private tahakkukService: TahakkukService,
    private lateFeeService: LateFeeService,
  ) {}

  // ========================
  // Aidat Kuralları (TahakkukRule)
  // ========================

  @Get('rules')
  async getRules(
    @Query('organizationId') orgId: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.tahakkukService.getRules(orgId, buildingId);
  }

  @Post('rules')
  async createRule(
    @Query('organizationId') orgId: string,
    @Body() dto: any,
  ) {
    return this.tahakkukService.createRule(orgId, dto);
  }

  @Put('rules/:ruleId')
  async updateRule(
    @Query('organizationId') orgId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: any,
  ) {
    return this.tahakkukService.updateRule(orgId, ruleId, dto);
  }

  @Delete('rules/:ruleId')
  async deleteRule(
    @Query('organizationId') orgId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.tahakkukService.deleteRule(orgId, ruleId);
  }

  // ========================
  // Tahakkuk (Charge) Oluşturma
  // ========================

  @Post('generate')
  async generateCharges(
    @Body()
    body: {
      organizationId: string;
      buildingId?: string;
      period: string;
      rules: any[];
    },
  ) {
    return this.tahakkukService.generateCharges(body);
  }

  @Get('charges')
  async getCharges(
    @Query('organizationId') orgId: string,
    @Query('period') period: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.tahakkukService.getChargesByPeriod(orgId, period, buildingId);
  }

  @Get('apartment/:apartmentId/balance')
  async getApartmentBalance(@Param('apartmentId') apartmentId: string) {
    return this.tahakkukService.getApartmentBalance(apartmentId);
  }

  // ========================
  // Gecikme Faizi (Late Fee) - KMK Madde 20
  // ========================

  @Post('calculate-late-fees')
  async calculateLateFees(
    @Body()
    body: {
      organizationId: string;
      period?: string; // Belirli dönem veya tümü
    },
  ) {
    return this.lateFeeService.calculateAllLateFees(body.organizationId, body.period);
  }

  @Get('late-fees')
  async getLateFees(
    @Query('organizationId') orgId: string,
    @Query('period') period?: string,
  ) {
    return this.lateFeeService.getLateFeesByPeriod(orgId, period);
  }
}