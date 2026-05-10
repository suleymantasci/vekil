import { LateFeeService } from './late-fees.service';
import { PrismaService } from '../auth/prisma.service';

describe('LateFeeService', () => {
  let service: LateFeeService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      charge: {
        findMany: jest.fn(),
      },
      lateFee: {
        create: jest.fn(),
      },
    };
    service = new LateFeeService(prisma as any);
  });

  describe('calculate', () => {
    it('should return 0 for no late days', () => {
      expect(service.calculate(1000, 0)).toBe(0);
      expect(service.calculate(1000, -5)).toBe(0);
    });

    it('should calculate simple interest correctly', () => {
      // Amount: 1000, Days: 30, Daily rate: 0.05/30 = 0.0016667
      // Expected: 1000 * 30 * (0.05/30) = 50
      const result = service.calculate(1000, 30);
      expect(result).toBe(50);
    });

    it('should calculate for 1 day late', () => {
      // Amount: 1000, 1 day, rate: 0.05/30
      // Expected: 1000 * 1 * (0.05/30) = 1.67 (rounded)
      const result = service.calculate(1000, 1);
      expect(result).toBeCloseTo(1.67, 1);
    });

    it('should calculate for 60 days late (2 months)', () => {
      // Amount: 1000, 60 days, rate: 0.05/30
      // Expected: 1000 * 60 * (0.05/30) = 100
      const result = service.calculate(1000, 60);
      expect(result).toBe(100);
    });

    it('should handle decimal amounts', () => {
      const result = service.calculate(1234.56, 30);
      // Expected: 1234.56 * 30 * 0.0016667 = 61.73
      expect(result).toBeCloseTo(61.73, 1);
    });
  });

  describe('dailyRate', () => {
    it('should be 0.05/30', () => {
      expect(service.dailyRate).toBeCloseTo(0.05 / 30, 10);
    });
  });
});

describe('KMK Madde 20 Compliance', () => {
  let service: LateFeeService;

  beforeEach(() => {
    const prisma = {};
    service = new LateFeeService(prisma as any);
  });

  it('should use 5% monthly rate as per KMK Article 20', () => {
    // 5% of 1000 = 50 for 30 days (1 month)
    const result = service.calculate(1000, 30);
    expect(result).toBe(50); // Exactly 5%
  });

  it('should calculate pro-rata for partial months', () => {
    // 15 days on 1000 should be 25 (half of 5%)
    const result = service.calculate(1000, 15);
    expect(result).toBe(25);
  });

  it('should NOT use legal interest rate (0.75% monthly)', () => {
    // Legal rate would be: 1000 * 30 * (0.0075/30) = 7.5
    // KMK rate is: 1000 * 30 * (0.05/30) = 50
    const kmkResult = service.calculate(1000, 30);
    expect(kmkResult).toBe(50); // 5%
    expect(kmkResult).not.toBe(7.5); // NOT 0.75%
  });
});