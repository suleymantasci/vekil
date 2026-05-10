import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreateMeetingDto {
  buildingId: string;
  title: string;
  description?: string;
  meetingDate: Date;
  location?: string;
}

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateMeetingDto) {
    return this.prisma.meeting.create({
      data: {
        organizationId,
        buildingId: dto.buildingId,
        title: dto.title,
        description: dto.description,
        meetingDate: dto.meetingDate,
        location: dto.location,
        status: 'DRAFT',
      },
      include: {
        building: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(organizationId: string, buildingId?: string) {
    return this.prisma.meeting.findMany({
      where: { organizationId, buildingId: buildingId || undefined },
      include: {
        building: { select: { id: true, name: true } },
        _count: { select: { votes: true, attendances: true } },
      },
      orderBy: { meetingDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
        attendances: {
          include: {
            apartment: { select: { id: true, unitNumber: true } },
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        votes: true,
      },
    });

    if (!meeting) throw new NotFoundException('Toplantı bulunamadı.');
    return meeting;
  }

  async update(organizationId: string, id: string, dto: Partial<CreateMeetingDto>) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, organizationId } });
    if (!meeting) throw new NotFoundException('Toplantı bulunamadı.');

    return this.prisma.meeting.update({
      where: { id },
      data: dto,
    });
  }

  async addAttendance(organizationId: string, meetingId: string, dto: { apartmentId: string }) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, organizationId } });
    if (!meeting) throw new NotFoundException('Toplantı bulunamadı.');

    return this.prisma.meetingAttendance.create({
      data: {
        meetingId,
        apartmentId: dto.apartmentId,
        userId: dto.apartmentId, // placeholder — real app uses apartmentId → user lookup
      },
    });
  }

  async recordAttendance(organizationId: string, meetingId: string, dto: { apartmentId: string; present: boolean }) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, organizationId } });
    if (!meeting) throw new NotFoundException('Toplantı bulunamadı.');

    return this.prisma.meetingAttendance.upsert({
      where: { meetingId_apartmentId: { meetingId, apartmentId: dto.apartmentId } },
      create: {
        meetingId,
        apartmentId: dto.apartmentId,
        userId: dto.apartmentId,
        present: dto.present,
      },
      update: { present: dto.present },
    });
  }
}
