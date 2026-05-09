import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';
import { CreateApartmentDto, UpdateApartmentDto } from './dto/apartments.dto';
import { paginate } from '../common/interfaces/api-response.interface';

@Injectable()
export class ApartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(buildingId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [apartments, total] = await this.prisma.$transaction([
      this.prisma.apartment.findMany({
        where: { buildingId },
        include: { users: true },
        skip,
        take: limit,
        orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      }),
      this.prisma.apartment.count({ where: { buildingId } }),
    ]);

    return paginate(apartments, total, { page, limit });
  }

  async findOne(id: string) {
    const apartment = await this.prisma.apartment.findUnique({
      where: { id },
      include: { building: true, users: true },
    });
    if (!apartment) throw new Error('Daire bulunamadı');
    return apartment;
  }

  async create(buildingId: string, dto: CreateApartmentDto) {
    return this.prisma.apartment.create({
      data: { ...dto, buildingId },
      include: { building: true },
    });
  }

  async createBatch(buildingId: string, apartments: CreateApartmentDto[]) {
    return this.prisma.apartment.createMany({
      data: apartments.map((a) => ({ ...a, buildingId })),
    });
  }

  async update(id: string, dto: UpdateApartmentDto) {
    const apartment = await this.prisma.apartment.findUnique({ where: { id } });
    if (!apartment) throw new Error('Daire bulunamadı');

    return this.prisma.apartment.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const apartment = await this.prisma.apartment.findUnique({ where: { id } });
    if (!apartment) throw new Error('Daire bulunamadı');

    await this.prisma.apartment.update({
      where: { id },
      data: { isActive: false },
    });

    return { deleted: true };
  }
}