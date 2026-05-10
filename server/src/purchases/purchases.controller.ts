import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { GetCurrentUser } from '../common/decorators/current-user.decorator';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post()
  create(@GetCurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  findAll(
    @GetCurrentUser() user: any,
    @Query('buildingId') buildingId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(user.organizationId, buildingId, status);
  }

  @Get(':id')
  findOne(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Put(':id/status')
  updateStatus(
    @GetCurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { status: string; awardedAmount?: number },
  ) {
    return this.service.updateStatus(user.organizationId, id, dto.status, dto.awardedAmount);
  }

  @Post(':id/quote')
  addSupplierQuote(
    @GetCurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { supplierId: string; amount: number; notes?: string },
  ) {
    return this.service.addSupplierQuote(user.organizationId, id, dto);
  }
}
