import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { PaymentRequestsService, PaymentStatus } from './payment-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * Payment Requests Controller
 * 
 * Handles online payment request lifecycle:
 * - Create payment requests
 * - List/filter payment requests
 * - Handle webhook callbacks from payment provider
 * - Cancel pending payments
 * 
 * SECURITY: All endpoints require JWT authentication
 */
@Controller('payment-requests')
@UseGuards(JwtAuthGuard)
export class PaymentRequestsController {
  constructor(private paymentService: PaymentRequestsService) {}

  /**
   * Create a new payment request
   * POST /payment-requests
   */
  @Post()
  async create(@Body() dto: any) {
    return this.paymentService.createRequest(dto.organizationId, dto);
  }

  /**
   * List payment requests
   * GET /payment-requests?organizationId=xxx&status=PENDING&apartmentId=xxx
   */
  @Get()
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('apartmentId') apartmentId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter: any = {};
    if (apartmentId) filter.apartmentId = apartmentId;
    if (status) filter.status = status;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);

    return this.paymentService.findAll(organizationId, filter);
  }

  /**
   * Get payment request by ID
   * GET /payment-requests/:id?organizationId=xxx
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.paymentService.findOne(organizationId, id);
  }

  /**
   * Get payment request by reference (from payment provider callback)
   * GET /payment-requests/ref/:ref?organizationId=xxx
   */
  @Get('ref/:ref')
  async findByRef(
    @Param('ref') ref: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.paymentService.findByRef(organizationId, ref);
  }

  /**
   * Update payment status (webhook callback from payment provider)
   * PATCH /payment-requests/:id/status
   * 
   * SECURITY: Should be validated with a webhook signature in production
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PaymentStatus; providerRef?: string },
  ) {
    return this.paymentService.updateStatus(id, body.status, body.providerRef);
  }

  /**
   * Cancel a pending payment request
   * PATCH /payment-requests/:id/cancel?organizationId=xxx
   */
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.paymentService.cancel(organizationId, id);
  }

  /**
   * Get payment request statistics
   * GET /payment-requests/stats?organizationId=xxx&startDate=xxx
   */
  @Get('stats/summary')
  async getStats(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentService.getStats(
      organizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Create bulk payment requests from charges
   * POST /payment-requests/bulk-from-charges
   */
  @Post('bulk-from-charges')
  async createBulkFromCharges(@Body() body: { organizationId: string; chargeIds: string[] }) {
    return this.paymentService.createBulkForCharges(body.organizationId, body.chargeIds);
  }
}