import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
@UseGuards(AuthGuard('jwt'))
export class WorkOrdersController {
  constructor(private workOrdersService: WorkOrdersService) {}

  @Post()
  async create(
    @Body() body: {
      organizationId: string;
      title: string;
      description: string;
      assetId?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      category?: 'electrical' | 'plumbing' | 'structural' | 'other';
      location?: string;
      photos?: string[];
    },
    @Query('userId') userId: string,
  ) {
    return this.workOrdersService.create(userId, body.organizationId, body);
  }

  @Get()
  async findAll(
    @Query('organizationId') orgId: string,
    @Query('buildingId') buildingId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.workOrdersService.findAll(orgId, {
      buildingId,
      status,
      priority,
      assignedTo,
    });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
  ) {
    return this.workOrdersService.findOne(orgId, id);
  }

  @Put(':id/assign')
  async assign(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
    @Body() body: { assignedToId: string },
  ) {
    return this.workOrdersService.assign(orgId, id, body.assignedToId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
    @Body() body: {
      status?: string;
      priority?: string;
      resolution?: string;
    },
  ) {
    return this.workOrdersService.update(orgId, id, body);
  }

  @Post(':id/photos')
  async addPhoto(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
    @Body() body: { photoUrl: string },
  ) {
    return this.workOrdersService.addPhoto(orgId, id, body.photoUrl);
  }

  @Get('stats/building/:buildingId')
  async getStatsByBuilding(@Param('buildingId') buildingId: string) {
    return this.workOrdersService.getStatsByBuilding(buildingId);
  }
}