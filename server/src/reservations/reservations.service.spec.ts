import { ReservationsService, CreateReservationDto } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      reservation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ReservationsService(prisma);
  });

  describe('create', () => {
    it('should throw BadRequestException on double booking', async () => {
      // Mock existing reservation that conflicts
      prisma.reservation.findFirst.mockResolvedValue({
        id: 'existing-res',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T11:00:00'),
      });

      const dto: CreateReservationDto = {
        buildingId: 'bld-1',
        apartmentId: 'apt-1',
        facility: 'pool',
        title: 'Havuz Partisi',
        startTime: new Date('2026-05-15T10:30:00'),
        endTime: new Date('2026-05-15T11:30:00'),
      };

      await expect(service.create('org-1', dto)).rejects.toThrow('Bu saat aralığında tesis zaten rezerve edilmiş.');
    });

    it('should create reservation when no conflict', async () => {
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue({ id: 'res-1', status: 'PENDING' });

      const dto: CreateReservationDto = {
        buildingId: 'bld-1',
        apartmentId: 'apt-1',
        facility: 'pool',
        title: 'Havuz Partisi',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T11:00:00'),
      };

      const result = await service.create('org-1', dto);

      expect(result).toEqual({ id: 'res-1', status: 'PENDING' });
      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          buildingId: 'bld-1',
          facility: 'pool',
          status: 'PENDING',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return all reservations for organization', async () => {
      const mockReservations = [
        { id: 'res-1', title: 'Havuz', facility: 'pool', status: 'PENDING' },
        { id: 'res-2', title: 'Kort', facility: 'court', status: 'APPROVED' },
      ];

      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      const result = await service.findAll('org-1');

      expect(result).toEqual(mockReservations);
    });

    it('should filter by buildingId', async () => {
      await service.findAll('org-1', 'bld-1');

      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ buildingId: 'bld-1' }),
        include: expect.any(Object),
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('approve', () => {
    it('should approve a pending reservation', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ id: 'res-1', status: 'PENDING' });
      prisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'APPROVED' });

      const result = await service.approve('org-1', 'res-1', 'admin-1');

      expect(result).toEqual({ id: 'res-1', status: 'APPROVED' });
      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'APPROVED', approvedBy: 'admin-1' },
      });
    });

    it('should throw NotFoundException for non-pending reservation', async () => {
      prisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.approve('org-1', 'res-1', 'admin-1')).rejects.toThrow('Onay bekleyen rezervasyon bulunamadı.');
    });
  });

  describe('cancel', () => {
    it('should cancel PENDING reservation', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ id: 'res-1', status: 'PENDING' });
      prisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'CANCELLED' });

      const result = await service.cancel('org-1', 'res-1');

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should cancel APPROVED reservation', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ id: 'res-1', status: 'APPROVED' });
      prisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'CANCELLED' });

      const result = await service.cancel('org-1', 'res-1');

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should throw NotFoundException for already cancelled', async () => {
      prisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.cancel('org-1', 'res-1')).rejects.toThrow('İptal edilebilir rezervasyon bulunamadı.');
    });
  });

  describe('getAvailableSlots', () => {
    it('should return hourly slots with availability', async () => {
      // Return empty reservations list (all slots available)
      prisma.reservation.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots('org-1', 'bld-1', 'pool', new Date('2026-05-15'));

      expect(result.length).toBe(13); // 09:00 to 22:00 = 13 hours
      expect(result.every((s: any) => s.available)).toBe(true);
    });

    it('should mark conflicting slots as unavailable', async () => {
      // One reservation from 10:00-11:00
      prisma.reservation.findMany.mockResolvedValue([{
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T11:00:00'),
      }]);

      const result = await service.getAvailableSlots('org-1', 'bld-1', 'pool', new Date('2026-05-15'));

      const bookedSlot = result.find((s: any) =>
        s.start === new Date('2026-05-15T10:00:00').toISOString()
      );
      const freeSlot = result.find((s: any) =>
        s.start === new Date('2026-05-15T09:00:00').toISOString()
      );

      expect(bookedSlot?.available).toBe(false);
      expect(freeSlot?.available).toBe(true);
    });
  });
});
