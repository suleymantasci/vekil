import { AssetsService, CreateAssetDto } from './assets.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      asset: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new AssetsService(prisma);
  });

  describe('create', () => {
    it('should create an asset with required fields', async () => {
      const dto: CreateAssetDto = {
        buildingId: 'bld-1',
        name: 'Ana Asansör',
        type: 'elevator',
      };

      const mockAsset = {
        id: 'asset-1',
        buildingId: 'bld-1',
        name: 'Ana Asansör',
        type: 'elevator',
        isActive: true,
      };

      prisma.asset.create.mockResolvedValue(mockAsset);

      const result = await service.create('org-1', dto);

      expect(result).toEqual(mockAsset);
      expect(prisma.asset.create).toHaveBeenCalledWith({
        data: {
          buildingId: 'bld-1',
          name: 'Ana Asansör',
          type: 'elevator',
          brand: undefined,
          model: undefined,
          serialNo: undefined,
          warrantyEnd: undefined,
          installDate: undefined,
          location: undefined,
          notes: undefined,
        },
        include: expect.any(Object),
      });
    });

    it('should create asset with all optional fields', async () => {
      const dto: CreateAssetDto = {
        buildingId: 'bld-1',
        name: 'Jeneratör',
        type: 'generator',
        brand: 'Caterpillar',
        model: 'C15',
        serialNo: 'SN123456',
        warrantyEnd: new Date('2027-01-01'),
        installDate: new Date('2024-01-01'),
        location: 'Bodrum Kat',
        notes: 'Ana bina jeneratörü',
      };

      prisma.asset.create.mockResolvedValue({ id: 'asset-1', ...dto });

      await service.create('org-1', dto);

      expect(prisma.asset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          brand: 'Caterpillar',
          model: 'C15',
          serialNo: 'SN123456',
          location: 'Bodrum Kat',
        }),
        include: expect.any(Object),
      });
    });

    it('should create elevator asset', async () => {
      prisma.asset.create.mockResolvedValue({ id: 'asset-1', type: 'elevator' });
      await service.create('org-1', { buildingId: 'bld-1', name: 'Test', type: 'elevator' });
      expect(prisma.asset.create).toHaveBeenCalled();
      const call = prisma.asset.create.mock.calls[0][0];
      expect(call.data.type).toBe('elevator');
    });

    it('should create generator asset', async () => {
      prisma.asset.create.mockResolvedValue({ id: 'asset-1', type: 'generator' });
      await service.create('org-1', { buildingId: 'bld-1', name: 'Test', type: 'generator' });
      expect(prisma.asset.create).toHaveBeenCalled();
      const call = prisma.asset.create.mock.calls[0][0];
      expect(call.data.type).toBe('generator');
    });
  });

  describe('findAll', () => {
    it('should return all active assets for organization', async () => {
      const mockAssets = [
        { id: 'asset-1', name: 'Asansör 1', type: 'elevator', isActive: true },
        { id: 'asset-2', name: 'Jeneratör', type: 'generator', isActive: true },
      ];

      prisma.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.findAll('org-1');

      expect(result).toEqual(mockAssets);
      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: {
          building: { organizationId: 'org-1' },
          buildingId: undefined,
          isActive: true,
        },
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });

    it('should filter by buildingId', async () => {
      await service.findAll('org-1', 'bld-1');

      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          buildingId: 'bld-1',
        }),
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an asset by id', async () => {
      const mockAsset = {
        id: 'asset-1',
        name: 'Asansör',
        type: 'elevator',
        building: { id: 'bld-1', name: 'Building A' },
      };

      prisma.asset.findFirst.mockResolvedValue(mockAsset);

      const result = await service.findOne('org-1', 'asset-1');

      expect(result).toEqual(mockAsset);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.asset.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org-1', 'nonexistent')).rejects.toThrow('Demirbaş bulunamadı');
    });
  });

  describe('delete (soft delete)', () => {
    it('should set isActive to false', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', isActive: true });
      prisma.asset.update.mockResolvedValue({ id: 'asset-1', isActive: false });

      await service.delete('org-1', 'asset-1');

      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: { isActive: false },
      });
    });
  });

  describe('getWarrantyStatus', () => {
    it('should return "unknown" when no warranty date', async () => {
      const asset = { id: 'asset-1', name: 'Test', warrantyEnd: null };
      prisma.asset.findFirst.mockResolvedValue(asset);

      const result = await service.getWarrantyStatus('org-1', 'asset-1');

      expect(result.warrantyStatus).toBe('unknown');
      expect(result.daysRemaining).toBeNull();
    });

    it('should return "active" when warranty is in future (>30 days)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);
      const asset = { id: 'asset-1', name: 'Test', warrantyEnd: futureDate };
      prisma.asset.findFirst.mockResolvedValue(asset);

      const result = await service.getWarrantyStatus('org-1', 'asset-1');

      expect(result.warrantyStatus).toBe('active');
      expect(result.daysRemaining).toBeGreaterThan(30);
    });

    it('should return "expiring_soon" when warranty < 30 days', async () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15);
      const asset = { id: 'asset-1', name: 'Test', warrantyEnd: soonDate };
      prisma.asset.findFirst.mockResolvedValue(asset);

      const result = await service.getWarrantyStatus('org-1', 'asset-1');

      expect(result.warrantyStatus).toBe('expiring_soon');
      expect(result.daysRemaining).toBeLessThanOrEqual(30);
    });

    it('should return "expired" when warranty date passed', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const asset = { id: 'asset-1', name: 'Test', warrantyEnd: pastDate };
      prisma.asset.findFirst.mockResolvedValue(asset);

      const result = await service.getWarrantyStatus('org-1', 'asset-1');

      expect(result.warrantyStatus).toBe('expired');
      expect(result.daysRemaining).toBeLessThan(0);
    });
  });
});