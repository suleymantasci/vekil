import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApartmentsService } from './apartments.service';
import { CreateApartmentDto, UpdateApartmentDto } from './dto/apartments.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('apartments')
export class ApartmentsController {
  constructor(private apartmentsService: ApartmentsService) {}

  @Get()
  async findAll(@Query('buildingId') buildingId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    if (!buildingId) return ApiResponse.error('buildingId gerekli');
    try {
      const result = await this.apartmentsService.findAll(buildingId, +page, +limit);
      return ApiResponse.success(result.data, result.meta);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const apartment = await this.apartmentsService.findOne(id);
      return ApiResponse.success(apartment);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post()
  async create(@Body() dto: CreateApartmentDto) {
    try {
      const apartment = await this.apartmentsService.create(dto.buildingId, dto);
      return ApiResponse.success(apartment);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('batch')
  async createBatch(@Body() data: { buildingId: string; apartments: CreateApartmentDto[] }) {
    try {
      const result = await this.apartmentsService.createBatch(data.buildingId, data.apartments);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateApartmentDto) {
    try {
      const apartment = await this.apartmentsService.update(id, dto);
      return ApiResponse.success(apartment);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.apartmentsService.remove(id);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }
}