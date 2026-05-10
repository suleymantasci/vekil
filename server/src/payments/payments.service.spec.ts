import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback(prisma)),
      payment: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      charge: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new PaymentsService(prisma);
  });

  describe('createPayment', () => {
    it('should create a payment and update charge status to PAID when fully paid', async () => {
      const mockPayment = {
        id: 'pay-1',
        amount: 500,
        apartmentId: 'apt-1',
        chargeId: 'charge-1',
      };
      const mockCharge = {
        id: 'charge-1',
        amount: 500,
        paidAmount: 0,
        status: 'PENDING',
      };

      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.charge.findUnique.mockResolvedValue(mockCharge);
      prisma.charge.update.mockResolvedValue({ ...mockCharge, paidAmount: 500, status: 'PAID' });

      const result = await service.createPayment({
        organizationId: 'org-1',
        apartmentId: 'apt-1',
        chargeId: 'charge-1',
        amount: 500,
        paymentMethod: 'BANK_TRANSFER',
      });

      expect(result).toEqual(mockPayment);
      expect(prisma.charge.update).toHaveBeenCalledWith({
        where: { id: 'charge-1' },
        data: { paidAmount: 500, status: 'PAID' },
      });
    });

    it('should set status to PARTIAL when partially paid', async () => {
      const mockPayment = {
        id: 'pay-1',
        amount: 300,
        apartmentId: 'apt-1',
        chargeId: 'charge-1',
      };
      const mockCharge = {
        id: 'charge-1',
        amount: 500,
        paidAmount: 0,
        status: 'PENDING',
      };

      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.charge.findUnique.mockResolvedValue(mockCharge);
      prisma.charge.update.mockResolvedValue({ ...mockCharge, paidAmount: 300, status: 'PARTIAL' });

      const result = await service.createPayment({
        organizationId: 'org-1',
        apartmentId: 'apt-1',
        chargeId: 'charge-1',
        amount: 300,
      });

      expect(prisma.charge.update).toHaveBeenCalledWith({
        where: { id: 'charge-1' },
        data: { paidAmount: 300, status: 'PARTIAL' },
      });
    });
  });

  describe('getPayments', () => {
    it('should return paginated payments', async () => {
      const mockPayments = [
        { id: 'pay-1', amount: 500, paidAt: new Date() },
        { id: 'pay-2', amount: 300, paidAt: new Date() },
      ];

      prisma.payment.findMany.mockResolvedValue(mockPayments);
      prisma.payment.count.mockResolvedValue(2);

      const result = await service.getPayments('org-1');

      expect(result.data).toEqual(mockPayments);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('getPeriodSummary', () => {
    it('should calculate correct summary', async () => {
      const mockCharges = [
        {
          id: 'charge-1',
          chargeType: 'MONTHLY_FEE',
          amount: 500,
          status: 'PENDING',
          payments: [{ amount: 0 }],
          lateFees: [] as any[],
        },
        {
          id: 'charge-2',
          chargeType: 'MONTHLY_FEE',
          amount: 300,
          status: 'PAID',
          payments: [{ amount: 300 }],
          lateFees: [] as any[],
        },
      ];

      prisma.charge.findMany.mockResolvedValue(mockCharges);

      const result = await service.getPeriodSummary('org-1', '2026-05');

      expect(result.totalCharges).toBe(2);
      expect(result.totalAmount).toBe(800);
      expect(result.totalPaid).toBe(300);
      expect(result.totalUnpaid).toBe(500);
      expect(result.byStatus.PENDING).toBe(1);
      expect(result.byStatus.PAID).toBe(1);
    });
  });
});

describe('Payment Distribution', () => {
  let service: PaymentsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback(prisma)),
      payment: { create: jest.fn() },
      charge: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new PaymentsService(prisma);
  });

  it('should pay oldest charges first (by dueDate)', async () => {
    const mockUnpaidCharges = [
      { id: 'charge-old', amount: 200, paidAmount: 0, dueDate: new Date('2026-01-01'), status: 'PENDING' },
      { id: 'charge-new', amount: 500, paidAmount: 0, dueDate: new Date('2026-05-01'), status: 'PENDING' },
    ];

    prisma.payment.create.mockResolvedValue({ id: 'pay-1', amount: 200 });
    prisma.charge.findMany.mockResolvedValue(mockUnpaidCharges);
    prisma.charge.update.mockResolvedValue({});

    await service.createPayment({
      organizationId: 'org-1',
      apartmentId: 'apt-1',
      amount: 200,
    });

    // Should pay the oldest charge first
    expect(prisma.charge.update).toHaveBeenCalledWith({
      where: { id: 'charge-old' },
      data: expect.objectContaining({ paidAmount: 200, status: 'PAID' }),
    });
  });

  it('should partially pay when amount is insufficient', async () => {
    const mockUnpaidCharges = [
      { id: 'charge-1', amount: 500, paidAmount: 0, dueDate: new Date('2026-01-01'), status: 'PENDING' },
    ];

    prisma.payment.create.mockResolvedValue({ id: 'pay-1', amount: 200 });
    prisma.charge.findMany.mockResolvedValue(mockUnpaidCharges);
    prisma.charge.update.mockResolvedValue({});

    await service.createPayment({
      organizationId: 'org-1',
      apartmentId: 'apt-1',
      amount: 200,
    });

    expect(prisma.charge.update).toHaveBeenCalledWith({
      where: { id: 'charge-1' },
      data: { paidAmount: 200, status: 'PARTIAL' },
    });
  });
});