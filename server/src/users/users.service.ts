import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../auth/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { paginate } from '../common/interfaces/api-response.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async findAll(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { organizationId },
        include: { roles: { include: { roles: { include: { role: true } } } }, apartment: { include: { building: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { organizationId } }),
    ]);

    return paginate(users, total, { page, limit, sort: 'createdAt', order: 'desc' });
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      include: { roles: { include: { roles: { include: { role: true } } } }, apartment: { include: { building: true } } },
    });
    if (!user) throw new Error('Kullanıcı bulunamadı');
    return user;
  }

  async create(organizationId: string, dto: CreateUserDto) {
    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        organizationId,
        roleId: dto.roleId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        apartmentId: dto.apartmentId,
      },
      include: { roles: { include: { role: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: organizationId, // will be set by interceptor
        organizationId,
        action: 'CREATE',
        resource: 'users',
        resourceId: user.id,
        newValue: { email: user.email, firstName: user.firstName, lastName: user.lastName },
      },
    });

    return user;
  }

  async update(id: string, organizationId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });
    if (!user) throw new Error('Kullanıcı bulunamadı');

    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.passwordHash = await argon2.hash(dto.password);
      delete updateData.password;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { roles: { include: { role: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: 'UPDATE',
        resource: 'users',
        resourceId: id,
        oldValue: { email: user.email },
        newValue: { email: updated.email },
      },
    });

    return updated;
  }

  async remove(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });
    if (!user) throw new Error('Kullanıcı bulunamadı');

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: 'DELETE',
        resource: 'users',
        resourceId: id,
      },
    });

    return { deleted: true };
  }
}