import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { GetCurrentUser } from '../common/decorators/current-user.decorator';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  @Post()
  create(@GetCurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  findAll(@GetCurrentUser() user: any, @Query('buildingId') buildingId?: string) {
    return this.service.findAll(user.organizationId, buildingId);
  }

  @Get(':id')
  findOne(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Put(':id')
  update(@GetCurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Post(':id/attendance')
  addAttendance(@GetCurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.addAttendance(user.organizationId, id, dto);
  }

  @Put(':id/attendance')
  recordAttendance(@GetCurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.recordAttendance(user.organizationId, id, dto);
  }
}
