import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { MetersService, MeterType, MeterStatus } from './meters.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * Meters Controller
 * 
 * Handles utility meter management and reading submission.
 * Supports electricity, water, gas, and heating meters.
 * 
 * SECURITY: JWT authentication required for all endpoints
 */
@Controller('meters')
@UseGuards(JwtAuthGuard)
export class MetersController {
  constructor(private metersService: MetersService) {}

  /**
   * Create a new meter
   * POST /meters
   */
  @Post()
  async createMeter(@Body() dto: any) {
    return this.metersService.createMeter(dto.organizationId, dto);
  }

  /**
   * List meters
   * GET /meters?organizationId=xxx&buildingId=xxx&meterType=ELECTRICITY
   */
  @Get()
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
    @Query('apartmentId') apartmentId?: string,
    @Query('meterType') meterType?: MeterType,
    @Query('status') status?: MeterStatus,
  ) {
    const filter: any = {};
    if (buildingId) filter.buildingId = buildingId;
    if (apartmentId) filter.apartmentId = apartmentId;
    if (meterType) filter.meterType = meterType;
    if (status) filter.status = status;

    return this.metersService.findAll(organizationId, filter);
  }

  /**
   * Get meter by ID
   * GET /meters/:id?organizationId=xxx
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.metersService.findOne(organizationId, id);
  }

  /**
   * Update meter status
   * PATCH /meters/:id/status?organizationId=xxx
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() body: { status: MeterStatus },
  ) {
    return this.metersService.updateStatus(organizationId, id, body.status);
  }

  /**
   * Submit meter reading
   * POST /meters/readings
   */
  @Post('readings')
  async submitReading(@Body() dto: any) {
    return this.metersService.submitReading(dto.organizationId, dto);
  }

  /**
   * Get readings for a meter
   * GET /meters/:id/readings?organizationId=xxx&startDate=xxx
   */
  @Get(':id/readings')
  async getReadings(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metersService.getReadings(
      organizationId,
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get consumption report
   * GET /meters/report?organizationId=xxx&buildingId=xxx
   */
  @Get('report/consumption')
  async getConsumptionReport(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metersService.getConsumptionReport(
      organizationId,
      buildingId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Delete meter (soft delete)
   * DELETE /meters/:id?organizationId=xxx
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.metersService.delete(organizationId, id);
  }
}