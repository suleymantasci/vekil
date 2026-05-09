import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [organizations, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, buildings: true } } },
      }),
      this.prisma.organization.count(),
    ]);

    return {
      data: organizations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, firstName: true, lastName: true, email: true } },
        buildings: true,
      },
    });
    if (!org) throw new Error('Organizasyon bulunamadı');
    return org;
  }

  async update(id: string, data: { name?: string; logo?: string; address?: string }) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }
}