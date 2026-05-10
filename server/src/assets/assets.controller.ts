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
import { AssetsService } from './assets.service';

@Controller('assets')
@UseGuards(AuthGuard('jwt'))
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Post()
  async create(
    @Query('organizationId') orgId: string,
    @Body() body: any,
  ) {
    return this.assetsService.create(orgId, body);
  }

  @Get()
  async findAll(
    @Query('organizationId') orgId: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.assetsService.findAll(orgId, buildingId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
  ) {
    return this.assetsService.findOne(orgId, id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
    @Body() body: any,
  ) {
    return this.assetsService.update(orgId, id, body);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
  ) {
    return this.assetsService.delete(orgId, id);
  }

  @Get(':id/warranty')
  async getWarrantyStatus(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
  ) {
    return this.assetsService.getWarrantyStatus(orgId, id);
  }
}