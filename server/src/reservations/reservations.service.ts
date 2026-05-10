import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreateReservationDto {
  buildingId: string;
  apartmentId: string;
  facility: 'pool' | 'court' | 'parking' | 'meeting_room' | 'gym' | 'other';
  title: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateReservationDto) {
    // Conflict check
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        buildingId: dto.buildingId,
        facility: dto.facility,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startTime: { gte: dto.startTime }, endTime: { lte: dto.endTime } },
          { startTime: { lt: dto.endTime }, endTime: { gt: dto.startTime } },
        ],
      },
    });

    if (conflict) {
      throw new BadRequestException('Bu saat aralığında tesis zaten rezerve edilmiş.');
    }

    return this.prisma.reservation.create({
      data: {
        organizationId,
        buildingId: dto.buildingId,
        apartmentId: dto.apartmentId,
        facility: dto.facility,
        title: dto.title,
        startTime: dto.startTime,
        endTime: dto.endTime,
        notes: dto.notes,
        status: 'PENDING',
      },
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
    });
  }

  async findAll(organizationId: string, buildingId?: string, facility?: string) {
    return this.prisma.reservation.findMany({
      where: {
        organizationId,
        buildingId: buildingId || undefined,
        facility: facility || undefined,
      },
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
    });

    if (!reservation) throw new NotFoundException('Rezervasyon bulunamadı.');
    return reservation;
  }

  async approve(organizationId: string, id: string, approvedBy: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, organizationId, status: 'PENDING' },
    });

    if (!reservation) throw new NotFoundException('Onay bekleyen rezervasyon bulunamadı.');

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy },
    });
  }

  async reject(organizationId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, organizationId, status: 'PENDING' },
    });

    if (!reservation) throw new NotFoundException('İptal edilecek rezervasyon bulunamadı.');

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async cancel(organizationId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, organizationId, status: { in: ['PENDING', 'APPROVED'] } },
    });

    if (!reservation) throw new NotFoundException('İptal edilebilir rezervasyon bulunamadı.');

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getAvailableSlots(organizationId: string, buildingId: string, facility: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        organizationId,
        buildingId,
        facility,
        status: { in: ['PENDING', 'APPROVED'] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    // Generate hourly slots (09:00 - 22:00)
    const slots = [];
    for (let hour = 9; hour < 22; hour++) {
      const slotStart = new Date(dayStart);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(dayStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const isBooked = reservations.some(
        (r) => r.startTime < slotEnd && r.endTime > slotStart,
      );

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isBooked,
      });
    }

    return slots;
  }
}
