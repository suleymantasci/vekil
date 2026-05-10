import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { GetCurrentUser, GetCurrentUserId } from '../common/decorators/current-user.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  create(@GetCurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  findAll(
    @GetCurrentUser() user: any,
    @Query('buildingId') buildingId?: string,
    @Query('facility') facility?: string,
  ) {
    return this.service.findAll(user.organizationId, buildingId, facility);
  }

  @Get('availability')
  getAvailableSlots(
    @GetCurrentUser() user: any,
    @Query('buildingId') buildingId: string,
    @Query('facility') facility: string,
    @Query('date') date: string,
  ) {
    return this.service.getAvailableSlots(user.organizationId, buildingId, facility, new Date(date));
  }

  @Get(':id')
  findOne(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Put(':id/approve')
  approve(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.approve(user.organizationId, id, user.id);
  }

  @Put(':id/reject')
  reject(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.reject(user.organizationId, id);
  }

  @Delete(':id')
  cancel(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.cancel(user.organizationId, id);
  }
}
