import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { VisitorsService, VisitorStatus } from './visitors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * Visitors Controller
 * 
 * Handles visitor invitation lifecycle:
 * - Create visitor invitation with QR code
 * - Check in/out visitors
 * - View visitor history and access logs
 * 
 * SECURITY: Most endpoints require JWT authentication
 * Check-in endpoint is public (uses access code)
 */
@Controller('visitors')
export class VisitorsController {
  constructor(private visitorsService: VisitorsService) {}

  /**
   * Create a new visitor invitation
   * POST /visitors
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: any) {
    return this.visitorsService.createInvitation(dto.organizationId, dto);
  }

  /**
   * List visitors
   * GET /visitors?organizationId=xxx&status=PENDING&buildingId=xxx
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter: any = {};
    if (buildingId) filter.buildingId = buildingId;
    if (status) filter.status = status;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);

    return this.visitorsService.findAll(organizationId, filter);
  }

  /**
   * Get visitor by ID
   * GET /visitors/:id?organizationId=xxx
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.visitorsService.findOne(organizationId, id);
  }

  /**
   * Check in visitor using access code (public endpoint)
   * POST /visitors/check-in
   */
  @Post('check-in')
  async checkIn(@Body() body: { organizationId: string; accessCode: string }) {
    return this.visitorsService.checkIn(body.organizationId, body.accessCode);
  }

  /**
   * Check out visitor
   * PATCH /visitors/:id/check-out?organizationId=xxx
   */
  @Patch(':id/check-out')
  @UseGuards(JwtAuthGuard)
  async checkOut(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.visitorsService.checkOut(organizationId, id);
  }

  /**
   * Get access logs for visitor
   * GET /visitors/:id/logs?organizationId=xxx
   */
  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  async getAccessLogs(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.visitorsService.getAccessLogs(organizationId, id);
  }

  /**
   * Cancel visitor invitation
   * PATCH /visitors/:id/cancel?organizationId=xxx
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.visitorsService.cancel(organizationId, id);
  }

  /**
   * Get visitor statistics
   * GET /visitors/stats/summary?organizationId=xxx
   */
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard)
  async getStats(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.visitorsService.getStats(organizationId, buildingId);
  }
}