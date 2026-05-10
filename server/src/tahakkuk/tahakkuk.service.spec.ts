import { TahakkukService, TahakkukRuleDto } from './tahakkuk.service';

describe('TahakkukService', () => {
  let service: TahakkukService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      tahakkukRule: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      apartment: {
        findMany: jest.fn(),
      },
      charge: {
        findFirst: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new TahakkukService(prisma);
  });

  describe('getRules', () => {
    it('should return all active rules for organization', async () => {
      const mockRules = [
        { id: '1', name: 'Aylık Aidat', amount: 500 },
        { id: '2', name: 'Kapıcı', amount: 200 },
      ];
      prisma.tahakkukRule.findMany.mockResolvedValue(mockRules);

      const result = await service.getRules('org-1');
      expect(result).toEqual(mockRules);
      expect(prisma.tahakkukRule.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', buildingId: undefined, isActive: true },
        include: { building: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createRule', () => {
    it('should create a rule with correct data', async () => {
      const dto: TahakkukRuleDto = {
        name: 'Aylık Aidat',
        chargeType: 'MONTHLY_FEE',
        calculationType: 'fixed',
        amount: 500,
        dueDay: 5,
      };
      const expected = { id: '1', ...dto, organizationId: 'org-1' };
      prisma.tahakkukRule.create.mockResolvedValue(expected);

      const result = await service.createRule('org-1', dto);
      expect(result).toEqual(expected);
      expect(prisma.tahakkukRule.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          buildingId: null,
          name: 'Aylık Aidat',
          chargeType: 'MONTHLY_FEE',
          calculationType: 'fixed',
          amount: 500,
          dueDay: 5,
          description: undefined,
        },
      });
    });

    it('should pass buildingId when provided', async () => {
      const dto: TahakkukRuleDto = {
        name: 'Bina Ozel Aidat',
        chargeType: 'MONTHLY_FEE',
        calculationType: 'fixed',
        amount: 300,
        dueDay: 10,
        buildingId: 'building-1',
      };

      await service.createRule('org-1', dto);
      expect(prisma.tahakkukRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          buildingId: 'building-1',
        }),
      });
    });
  });

  describe('deleteRule', () => {
    it('should soft delete rule by setting isActive=false', async () => {
      await service.deleteRule('org-1', 'rule-1');
      expect(prisma.tahakkukRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1', organizationId: 'org-1' },
        data: { isActive: false },
      });
    });
  });
});

describe('Tahakkuk Charge Calculation', () => {
  let service: TahakkukService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      apartment: { findMany: jest.fn() },
      charge: { findFirst: jest.fn(), createMany: jest.fn() },
    };
    service = new TahakkukService(prisma);
  });

  describe('calculation types', () => {
    const mockApartments = [
      {
        id: 'apt-1',
        number: '101',
        buildingId: 'bld-1',
        areaM2: 100,
        shareRatio: 0.05,
        building: { name: 'Building A' },
        users: [],
      },
      {
        id: 'apt-2',
        number: '102',
        buildingId: 'bld-1',
        areaM2: 150,
        shareRatio: 0.075,
        building: { name: 'Building A' },
        users: [],
      },
    ];

    beforeEach(() => {
      prisma.apartment.findMany.mockResolvedValue(mockApartments);
      prisma.charge.findFirst.mockResolvedValue(null); // No existing charges
      prisma.charge.createMany.mockResolvedValue({ count: 2 });
    });

    it('should calculate fixed amount correctly', async () => {
      const rules: TahakkukRuleDto[] = [
        {
          name: 'Aylık Aidat',
          chargeType: 'MONTHLY_FEE',
          calculationType: 'fixed',
          amount: 500,
          dueDay: 5,
        },
      ];

      await service.generateCharges({
        organizationId: 'org-1',
        period: '2026-05',
        rules,
      });

      // Should create 2 charges (one per apartment) with 500 each
      expect(prisma.charge.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ amount: 500 }),
          expect.objectContaining({ amount: 500 }),
        ]),
      });
    });

    it('should calculate area_m2 correctly', async () => {
      const rules: TahakkukRuleDto[] = [
        {
          name: 'm² Aidat',
          chargeType: 'MONTHLY_FEE',
          calculationType: 'area_m2',
          amount: 5, // 5₺ per m²
          dueDay: 5,
        },
      ];

      await service.generateCharges({
        organizationId: 'org-1',
        period: '2026-05',
        rules,
      });

      // apt-1: 100m² * 5 = 500, apt-2: 150m² * 5 = 750
      expect(prisma.charge.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ amount: 500 }),  // 100 * 5
          expect.objectContaining({ amount: 750 }),  // 150 * 5
        ]),
      });
    });

    it('should calculate share_ratio correctly', async () => {
      const rules: TahakkukRuleDto[] = [
        {
          name: 'Pay Oranlı Aidat',
          chargeType: 'MONTHLY_FEE',
          calculationType: 'share_ratio',
          amount: 10000, // 10000₺ * shareRatio
          dueDay: 5,
        },
      ];

      await service.generateCharges({
        organizationId: 'org-1',
        period: '2026-05',
        rules,
      });

      // apt-1: 10000 * 0.05 = 500, apt-2: 10000 * 0.075 = 750
      expect(prisma.charge.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ amount: 500 }),  // 10000 * 0.05
          expect.objectContaining({ amount: 750 }),  // 10000 * 0.075
        ]),
      });
    });

    it('should skip existing charges for same period', async () => {
      const rules: TahakkukRuleDto[] = [
        {
          name: 'Aylık Aidat',
          chargeType: 'MONTHLY_FEE',
          calculationType: 'fixed',
          amount: 500,
          dueDay: 5,
        },
      ];

      // First apartment already has a charge
      prisma.charge.findFirst
        .mockResolvedValueOnce({ id: 'existing' }) // apt-1 has existing
        .mockResolvedValueOnce(null); // apt-2 is new

      await service.generateCharges({
        organizationId: 'org-1',
        period: '2026-05',
        rules,
      });

      // Should only create 1 new charge (for apt-2)
      expect(prisma.charge.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ apartmentId: 'apt-2' }),
        ]),
      });
    });

    it('should not create charges for wrong building', async () => {
      const rules: TahakkukRuleDto[] = [
        {
          name: 'Sadece Bina 2',
          chargeType: 'MONTHLY_FEE',
          calculationType: 'fixed',
          amount: 100,
          dueDay: 5,
          buildingId: 'bld-2', // Only for building 2
        },
      ];

      await service.generateCharges({
        organizationId: 'org-1',
        period: '2026-05',
        rules,
      });

      // All apartments are in bld-1, rule is for bld-2 → no charges
      expect(prisma.charge.createMany).not.toHaveBeenCalled();
    });
  });
});