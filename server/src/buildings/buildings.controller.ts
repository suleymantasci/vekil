import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/buildings.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('buildings')
export class BuildingsController {
  constructor(private buildingsService: BuildingsService) {}

  @Get()
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    try {
      const result = await this.buildingsService.findAll(orgId, +page, +limit);
      return ApiResponse.success(result.data, result.meta);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    try {
      const building = await this.buildingsService.findOne(id, orgId);
      return ApiResponse.success(building);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post()
  async create(@Body() dto: CreateBuildingDto, @CurrentUser('organizationId') orgId: string) {
    try {
      const building = await this.buildingsService.create(orgId, dto);
      return ApiResponse.success(building);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBuildingDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    try {
      const building = await this.buildingsService.update(id, orgId, dto);
      return ApiResponse.success(building);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    try {
      const result = await this.buildingsService.remove(id, orgId);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }
}