import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  async findAll(@CurrentUser('organizationId') orgId: string) {
    try {
      const roles = await this.rolesService.findAll(orgId);
      return ApiResponse.success(roles);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    try {
      const role = await this.rolesService.findOne(id, orgId);
      return ApiResponse.success(role);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post()
  async create(
    @Body() data: { name: string; description?: string },
    @CurrentUser('organizationId') orgId: string,
  ) {
    try {
      const role = await this.rolesService.create(orgId, data.name, data.description);
      return ApiResponse.success(role);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post(':id/permissions')
  async addPermission(
    @Param('id') id: string,
    @Body() data: { permissionId: string },
    @CurrentUser('organizationId') orgId: string,
  ) {
    try {
      // Verify role belongs to org
      await this.rolesService.findOne(id, orgId);
      const result = await this.rolesService.addPermission(id, data.permissionId);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Delete(':id/permissions/:permissionId')
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    try {
      await this.rolesService.findOne(id, orgId);
      await this.rolesService.removePermission(id, permissionId);
      return ApiResponse.success({ removed: true });
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }
}