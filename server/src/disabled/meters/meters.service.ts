import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

// Meter type enum
export enum MeterType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  GAS = 'GAS',
  HEATING = 'HEATING', // Kalorimetre
}

// Meter status enum
export enum MeterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export interface CreateMeterDto {
  organizationId: string;
  buildingId: string;
  apartmentId?: string;
  meterNumber: string;
  meterType: MeterType;
  location?: string;
  initialReading?: number;
  lastReadingDate?: Date;
}

export interface CreateReadingDto {
  meterId: string;
  reading: number;
  readingDate: Date;
  readBy?: string;
}

export interface MeterFilter {
  buildingId?: string;
  apartmentId?: string;
  meterType?: MeterType;
  status?: MeterStatus;
}

/**
 * Meter Management Service
 * 
 * Handles utility meter tracking (electricity, water, gas, heating).
 * Supports reading submission and consumption tracking.
 * SECURITY: All operations are scoped to organization via RLS.
 */
@Injectable()
export class MetersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new meter
   */
  async createMeter(organizationId: string, dto: CreateMeterDto) {
    return this.prisma.meter.create({
      data: {
        organizationId,
        buildingId: dto.buildingId,
        apartmentId: dto.apartmentId || null,
        meterNumber: dto.meterNumber,
        meterType: dto.meterType,
        location: dto.location || null,
        status: MeterStatus.ACTIVE,
        lastReading: dto.initialReading || 0,
        lastReadingDate: dto.lastReadingDate || new Date(),
      },
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
    });
  }

  /**
   * List meters with optional filters
   */
  async findAll(organizationId: string, filter?: MeterFilter) {
    const where: any = { organizationId };

    if (filter?.buildingId) where.buildingId = filter.buildingId;
    if (filter?.apartmentId) where.apartmentId = filter.apartmentId;
    if (filter?.meterType) where.meterType = filter.meterType;
    if (filter?.status) where.status = filter.status;

    return this.prisma.meter.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single meter
   */
  async findOne(organizationId: string, id: string) {
    const meter = await this.prisma.meter.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
        readings: {
          orderBy: { readingDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!meter) {
      throw new NotFoundException('Sayaç bulunamadı');
    }

    return meter;
  }

  /**
   * Update meter status
   */
  async updateStatus(organizationId: string, id: string, status: MeterStatus) {
    await this.findOne(organizationId, id); // Verify exists

    return this.prisma.meter.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Submit a meter reading
   */
  async submitReading(organizationId: string, dto: CreateReadingDto) {
    // Verify meter belongs to organization
    const meter = await this.prisma.meter.findFirst({
      where: { id: dto.meterId, organizationId },
    });

    if (!meter) {
      throw new NotFoundException('Sayaç bulunamadı');
    }

    // Create reading record
    const reading = await this.prisma.meterReading.create({
      data: {
        meterId: dto.meterId,
        reading: dto.reading,
        readingDate: dto.readingDate,
        readBy: dto.readBy || null,
        previousReading: meter.lastReading,
        consumption: dto.reading - meter.lastReading,
      },
      include: {
        meter: {
          select: { meterNumber: true, meterType: true },
        },
      },
    });

    // Update meter's last reading
    await this.prisma.meter.update({
      where: { id: dto.meterId },
      data: {
        lastReading: dto.reading,
        lastReadingDate: dto.readingDate,
      },
    });

    return reading;
  }

  /**
   * Get readings for a meter
   */
  async getReadings(organizationId: string, meterId: string, startDate?: Date, endDate?: Date) {
    // Verify meter belongs to organization
    const meter = await this.prisma.meter.findFirst({
      where: { id: meterId, organizationId },
    });

    if (!meter) {
      throw new NotFoundException('Sayaç bulunamadı');
    }

    const where: any = { meterId };
    if (startDate || endDate) {
      where.readingDate = {};
      if (startDate) where.readingDate.gte = startDate;
      if (endDate) where.readingDate.lte = endDate;
    }

    return this.prisma.meterReading.findMany({
      where,
      orderBy: { readingDate: 'desc' },
    });
  }

  /**
   * Get consumption report for a period
   */
  async getConsumptionReport(organizationId: string, buildingId?: string, startDate?: Date, endDate?: Date) {
    const where: any = { organizationId };
    if (buildingId) where.buildingId = buildingId;

    const meters = await this.prisma.meter.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
        apartment: { select: { id: true, unitNumber: true } },
        readings: {
          where: {
            readingDate: {
              gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days
              lte: endDate || new Date(),
            },
          },
          orderBy: { readingDate: 'desc' },
        },
      },
    });

    // Calculate consumption per meter
    const report = meters.map((meter: any) => {
      const readings = meter.readings;
      let totalConsumption = 0;
      
      if (readings.length >= 2) {
        totalConsumption = readings[0].reading - readings[readings.length - 1].previousReading;
      } else if (readings.length === 1) {
        totalConsumption = readings[0].consumption || 0;
      }

      return {
        meterId: meter.id,
        meterNumber: meter.meterNumber,
        meterType: meter.meterType,
        building: meter.building.name,
        apartment: meter.apartment?.unitNumber || 'N/A',
        lastReading: meter.lastReading,
        totalConsumption,
        readingCount: readings.length,
      };
    });

    // Summary by type
    const byType = report.reduce((acc: Record<string, { totalConsumption: number; meterCount: number }>, r: any) => {
      if (!acc[r.meterType]) {
        acc[r.meterType] = { totalConsumption: 0, meterCount: 0 };
      }
      acc[r.meterType].totalConsumption += r.totalConsumption;
      acc[r.meterType].meterCount++;
      return acc;
    }, {} as Record<string, { totalConsumption: number; meterCount: number }>);

    return { report, byType };
  }

  /**
   * Delete a meter (soft delete by setting inactive)
   */
  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.meter.update({
      where: { id },
      data: { status: MeterStatus.INACTIVE },
    });
  }
}