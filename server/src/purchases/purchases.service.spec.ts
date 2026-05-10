import { PurchasesService, CreatePurchaseRequestDto } from './purchases.service';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      purchaseRequest: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new PurchasesService(prisma);
  });

  describe('create', () => {
    it('should create a purchase request with DRAFT status', async () => {
      const dto: CreatePurchaseRequestDto = {
        buildingId: 'bld-1',
        title: 'Asansör Bakımı',
        description: 'Yıllık asansör bakım ve kontrol hizmeti',
        category: 'maintenance',
        estimatedAmount: 15000,
      };

      prisma.purchaseRequest.create.mockResolvedValue({ id: 'pr-1', status: 'DRAFT', ...dto });

      const result = await service.create('org-1', dto);

      expect(result).toHaveProperty('id', 'pr-1');
      expect(prisma.purchaseRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'DRAFT', estimatedAmount: 15000 }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return all purchase requests', async () => {
      const mockPurchases = [
        { id: 'pr-1', title: 'Bakım', status: 'DRAFT' },
        { id: 'pr-2', title: 'Temizlik', status: 'PUBLISHED' },
      ];

      prisma.purchaseRequest.findMany.mockResolvedValue(mockPurchases);

      const result = await service.findAll('org-1');

      expect(result).toEqual(mockPurchases);
    });

    it('should filter by status', async () => {
      await service.findAll('org-1', undefined, 'DRAFT');

      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ status: 'DRAFT' }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update status and awarded amount', async () => {
      prisma.purchaseRequest.findFirst.mockResolvedValue({ id: 'pr-1', status: 'RECEIVED', awardedAmount: null });
      prisma.purchaseRequest.update.mockResolvedValue({ id: 'pr-1', status: 'APPROVED', awardedAmount: 12500 });

      const result = await service.updateStatus('org-1', 'pr-1', 'APPROVED', 12500);

      expect(result).toEqual({ id: 'pr-1', status: 'APPROVED', awardedAmount: 12500 });
    });

    it('should throw NotFoundException for unknown request', async () => {
      prisma.purchaseRequest.findFirst.mockResolvedValue(null);

      await expect(service.updateStatus('org-1', 'nonexistent', 'APPROVED', 1000))
        .rejects.toThrow('Talep bulunamadı.');
    });
  });

  describe('addSupplierQuote', () => {
    it('should append quote to notes', async () => {
      prisma.purchaseRequest.findFirst.mockResolvedValue({ id: 'pr-1', notes: '' });
      prisma.purchaseRequest.update.mockResolvedValue({ id: 'pr-1', notes: '\n[TEKLİF] supplier-1: 12500 ₺ ' });

      const result = await service.addSupplierQuote('org-1', 'pr-1', { supplierId: 'supplier-1', amount: 12500 });

      expect(prisma.purchaseRequest.update).toHaveBeenCalled();
      expect(result.notes).toContain('12500');
    });
  });
});
