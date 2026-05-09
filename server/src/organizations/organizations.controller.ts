import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    try {
      const result = await this.organizationsService.findAll(+page, +limit);
      return ApiResponse.success(result.data, result.meta);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const org = await this.organizationsService.findOne(id);
      return ApiResponse.success(org);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: { name?: string; logo?: string; address?: string }) {
    try {
      const org = await this.organizationsService.update(id, data);
      return ApiResponse.success(org);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }
}