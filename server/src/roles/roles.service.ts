import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, organizationId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new Error('Rol bulunamadı');
    return role;
  }

  async create(organizationId: string, name: string, description?: string) {
    return this.prisma.role.create({
      data: { name, description, organizationId },
    });
  }

  async addPermission(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }
}