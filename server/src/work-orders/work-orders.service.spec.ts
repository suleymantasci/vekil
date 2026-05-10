import { WorkOrdersService, CreateWorkOrderDto } from './work-orders.service';

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      workOrder: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      user: { findFirst: jest.fn() },
    };
    service = new WorkOrdersService(prisma);
  });

  describe('create', () => {
    it('should create a work order with default priority', async () => {
      const mockWorkOrder = {
        id: 'wo-1',
        reportedBy: 'user-1',
        title: 'Asansör arızası',
        description: 'Asansör çalışmıyor',
        status: 'open',
        priority: 'medium',
        category: 'other',
      };

      prisma.workOrder.create.mockResolvedValue(mockWorkOrder);

      const result = await service.create('user-1', 'org-1', {
        title: 'Asansör arızası',
        description: 'Asansör çalışmıyor',
        buildingId: 'bld-1',
      });

      expect(result).toEqual(mockWorkOrder);
      expect(prisma.workOrder.create).toHaveBeenCalledWith({
        data: {
          reportedBy: 'user-1',
          title: 'Asansör arızası',
          description: 'Asansör çalışmıyor',
          assetId: null,
          priority: 'medium',
          category: 'other',
          location: null,
          photos: [],
          status: 'open',
        },
        include: expect.any(Object),
      });
    });

    it('should create a work order with custom priority', async () => {
      const mockWorkOrder = {
        id: 'wo-1',
        reportedBy: 'user-1',
        title: 'Su kaçağı',
        description: 'Tesisat su kaçırıyor',
        priority: 'urgent',
        category: 'plumbing',
      };

      prisma.workOrder.create.mockResolvedValue(mockWorkOrder);

      await service.create('user-1', 'org-1', {
        title: 'Su kaçağı',
        description: 'Tesisat su kaçırıyor',
        priority: 'urgent',
        category: 'plumbing',
      });

      expect(prisma.workOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 'urgent',
          category: 'plumbing',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return all work orders for organization', async () => {
      const mockOrders = [
        { id: 'wo-1', title: 'Arıza 1', status: 'open' },
        { id: 'wo-2', title: 'Arıza 2', status: 'resolved' },
      ];

      prisma.workOrder.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll('org-1');

      expect(result).toEqual(mockOrders);
      expect(prisma.workOrder.findMany).toHaveBeenCalledWith({
        where: { reporter: { organizationId: 'org-1' } },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });

    it('should filter by buildingId', async () => {
      await service.findAll('org-1', { buildingId: 'bld-1' });

      expect(prisma.workOrder.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          asset: { buildingId: 'bld-1' },
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });

    it('should filter by status', async () => {
      await service.findAll('org-1', { status: 'open' });

      expect(prisma.workOrder.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'open',
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });

    it('should filter by priority', async () => {
      await service.findAll('org-1', { priority: 'urgent' });

      expect(prisma.workOrder.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          priority: 'urgent',
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });
  });

  describe('findOne', () => {
    it('should return a work order by id', async () => {
      const mockOrder = { id: 'wo-1', title: 'Test', status: 'open' };
      prisma.workOrder.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findOne('org-1', 'wo-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org-1', 'nonexistent')).rejects.toThrow('İş emri bulunamadı');
    });
  });

  describe('assign', () => {
    it('should assign a work order to user', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', status: 'open' });
      prisma.workOrder.update.mockResolvedValue({
        id: 'wo-1',
        assignedTo: 'tech-1',
        status: 'in_progress',
      });

      const result = await service.assign('org-1', 'wo-1', 'tech-1');

      expect(prisma.workOrder.update).toHaveBeenCalledWith({
        where: { id: 'wo-1' },
        data: { assignedTo: 'tech-1', status: 'in_progress' },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update status to resolved and set resolvedAt', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1' });
      prisma.workOrder.update.mockResolvedValue({ id: 'wo-1', status: 'resolved' });

      await service.update('org-1', 'wo-1', { status: 'resolved', resolution: 'Tamir edildi' });

      expect(prisma.workOrder.update).toHaveBeenCalledWith({
        where: { id: 'wo-1' },
        data: expect.objectContaining({
          status: 'resolved',
          resolution: 'Tamir edildi',
          resolvedAt: expect.any(Date),
        }),
      });
    });

    it('should update priority', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1' });
      prisma.workOrder.update.mockResolvedValue({ id: 'wo-1', priority: 'high' });

      await service.update('org-1', 'wo-1', { priority: 'high' });

      expect(prisma.workOrder.update).toHaveBeenCalledWith({
        where: { id: 'wo-1' },
        data: { priority: 'high' },
      });
    });
  });
});

describe('WorkOrdersService - Status Transitions', () => {
  let service: WorkOrdersService;
  let prisma: any;

  beforeEach(() => {
    prisma = { workOrder: { findFirst: jest.fn(), update: jest.fn() } };
    service = new WorkOrdersService(prisma);
  });

  const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];

  it.each(validStatuses)('should accept status: %s', async (status) => {
    prisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1' });
    prisma.workOrder.update.mockResolvedValue({ id: 'wo-1', status });

    const result = await service.update('org-1', 'wo-1', { status });
    expect(result).toBeDefined();
  });

  it('should set resolvedAt when status becomes resolved', async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1' });
    prisma.workOrder.update.mockResolvedValue({ id: 'wo-1', status: 'resolved' });

    await service.update('org-1', 'wo-1', { status: 'resolved' });

    expect(prisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: 'wo-1' },
      data: expect.objectContaining({ resolvedAt: expect.any(Date) }),
    });
  });

  it('should NOT set resolvedAt when status is open', async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1' });
    prisma.workOrder.update.mockResolvedValue({ id: 'wo-1', status: 'open' });

    await service.update('org-1', 'wo-1', { status: 'open' });

    const updateCall = prisma.workOrder.update.mock.calls[0][0];
    expect(updateCall.data.resolvedAt).toBeUndefined();
  });
});