import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  async createPayment(
    @Body()
    body: {
      organizationId: string;
      apartmentId: string;
      userId?: string;
      chargeId?: string;
      amount: number;
      paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DIGITAL_WALLET';
      reference?: string;
    },
  ) {
    return this.paymentsService.createPayment(body);
  }

  @Get()
  async getPayments(
    @Query('organizationId') orgId: string,
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getPayments(
      orgId,
      period,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  @Get('apartment/:apartmentId')
  async getApartmentPayments(
    @Param('apartmentId') apartmentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getPaymentsByApartment(
      apartmentId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('summary')
  async getPeriodSummary(
    @Query('organizationId') orgId: string,
    @Query('period') period: string,
  ) {
    return this.paymentsService.getPeriodSummary(orgId, period);
  }
}