import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/buildings.dto';
import { paginate } from '../common/interfaces/api-response.interface';

@Injectable()
export class BuildingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [buildings, total] = await this.prisma.$transaction([
      this.prisma.building.findMany({
        where: { organizationId },
        include: { _count: { select: { apartments: true, assets: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.building.count({ where: { organizationId } }),
    ]);

    return paginate(buildings, total, { page, limit });
  }

  async findOne(id: string, organizationId: string) {
    const building = await this.prisma.building.findFirst({
      where: { id, organizationId },
      include: {
        apartments: true,
        assets: true,
        _count: { select: { apartments: true, assets: true } },
      },
    });
    if (!building) throw new Error('Bina bulunamadı');
    return building;
  }

  async create(organizationId: string, dto: CreateBuildingDto) {
    return this.prisma.building.create({
      data: { ...dto, organizationId },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateBuildingDto) {
    const building = await this.prisma.building.findFirst({
      where: { id, organizationId },
    });
    if (!building) throw new Error('Bina bulunamadı');

    return this.prisma.building.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    const building = await this.prisma.building.findFirst({
      where: { id, organizationId },
    });
    if (!building) throw new Error('Bina bulunamadı');

    await this.prisma.building.update({
      where: { id },
      data: { isActive: false },
    });

    return { deleted: true };
  }
}