import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    try {
      const result = await this.usersService.findAll(orgId, +page, +limit);
      return ApiResponse.success(result.data, result.meta);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    try {
      const user = await this.usersService.findOne(id, orgId);
      return ApiResponse.success(user);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser('organizationId') orgId: string) {
    try {
      const user = await this.usersService.create(orgId, dto);
      return ApiResponse.success(user);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    try {
      const user = await this.usersService.update(id, orgId, dto);
      return ApiResponse.success(user);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    try {
      const result = await this.usersService.remove(id, orgId);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }
}