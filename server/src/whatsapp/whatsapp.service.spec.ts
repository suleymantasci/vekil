import { WhatsAppService, WhatsAppMessage } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      charge: { findMany: jest.fn() },
      payment: { findFirst: jest.fn() },
      kvkKConsent: { upsert: jest.fn() },
    };
    service = new WhatsAppService(prisma);
  });

  describe('processMessage - KVKK Consent Check', () => {
    it('should reject if user has no KVKK consent', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        phone: '905321234567',
        kvkkConsents: [],
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'borcum ne',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result).toBeDefined();
      expect(result?.text?.body).toContain('onay');
    });
  });

  describe('processMessage - Intent Classification', () => {
    beforeEach(() => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        firstName: 'Ali',
        lastName: 'Yılmaz',
        apartmentId: 'apt-1',
        kvkkConsents: [{ granted: true }],
      });
    });

    it('should classify "borcum" as balance intent', async () => {
      prisma.charge.findMany.mockResolvedValue([
        {
          amount: 500,
          paidAmount: 0,
          payments: [],
          lateFees: [],
        },
      ]);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'borcum ne',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('Borç');
    });

    it('should handle "ödeme" — matches balanceKeywords first (no debt)', async () => {
      // Note: "ödeme" matches balanceKeywords FIRST → balance query.
      // Response: "Borç bulunmamaktadır" when no charges found.
      prisma.charge.findMany.mockResolvedValue([]);
      prisma.payment.findFirst.mockResolvedValue({
        amount: 500,
        paidAt: new Date(),
        paymentMethod: 'BANK_TRANSFER',
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'son ödemem ne',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('Borç bulunmamaktadır');
    });

    it('should classify "yardim" as help intent', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'yardim',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toMatch(/yardim|komutlar|kullanılabilir/i);
    });
  });

  describe('processMessage - Commands', () => {
    beforeEach(() => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        firstName: 'Ali',
        lastName: 'Yılmaz',
        apartmentId: 'apt-1',
        kvkkConsents: [{ granted: true }],
      });
    });

    it('should handle /borcum command', async () => {
      prisma.charge.findMany.mockResolvedValue([]);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: '/borcum',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('Ali');
    });

    it('should handle /yardim command', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: '/yardim',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('/borcum');
    });

    it('should handle unknown command', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: '/bilinmeyen',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('tanıyamadım');
    });
  });

  describe('processMessage - FAQ Responses', () => {
    beforeEach(() => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        firstName: 'Ali',
        lastName: 'Yılmaz',
        apartmentId: 'apt-1',
        kvkkConsents: [{ granted: true }],
      });
    });

    it('should respond to "merhaba"', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'merhaba',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toMatch(/merhaba|hoş geldiniz/i);
    });

    it('should respond to "selam"', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'selam',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toMatch(/selam|merhaba/i);
    });

    it('should respond to "teşekkürler"', async () => {
      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'teşekkürler',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toMatch(/rica|teşekkür|yardımcı/i);
    });
  });

  describe('processMessage - Balance Query', () => {
    beforeEach(() => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        firstName: 'Ali',
        lastName: 'Yılmaz',
        apartmentId: 'apt-1',
        kvkkConsents: [{ granted: true }],
      });
    });

    it('should show zero balance when no debt', async () => {
      prisma.charge.findMany.mockResolvedValue([]);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'borcum ne',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('Borç bulunmamaktadır');
    });

    it('should calculate total debt correctly', async () => {
      prisma.charge.findMany.mockResolvedValue([
        { amount: 500, paidAmount: 200, payments: [{ amount: 200 }], lateFees: [] },
        { amount: 300, paidAmount: 0, payments: [], lateFees: [] },
      ]);

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'borcum ne',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('800'); // 500 + 300
      expect(result?.text?.body).toContain('200'); // 200 paid
    });

    it('should show message when no apartment registered', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        firstName: 'Ali',
        lastName: 'Yılmaz',
        apartmentId: null,
        kvkkConsents: [{ granted: true }],
      });

      const message: WhatsAppMessage = {
        id: 'msg-1',
        from: '905321234567',
        to: '905321234568',
        body: 'borcum ne',
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      const result = await service.processMessage(message);

      expect(result?.text?.body).toContain('Daire bilginiz sistemde kayıtlı değil');
    });
  });

  describe('grantConsent', () => {
    it('should create consent record', async () => {
      prisma.kvkKConsent.upsert.mockResolvedValue({ id: 'consent-1' });

      await service.grantConsent('user-1', 'whatsapp', 'chatbot', {
        ipAddress: '127.0.0.1',
        userAgent: 'WhatsApp',
      });

      expect(prisma.kvkKConsent.upsert).toHaveBeenCalledWith({
        where: {
          userId_channel_purpose: {
            userId: 'user-1',
            channel: 'whatsapp',
            purpose: 'chatbot',
          },
        },
        update: expect.objectContaining({
          granted: true,
          revokedAt: null,
        }),
        create: expect.objectContaining({
          userId: 'user-1',
          channel: 'whatsapp',
          purpose: 'chatbot',
          granted: true,
        }),
      });
    });
  });
});

describe('WhatsAppService - Message Structure', () => {
  let service: WhatsAppService;
  let prisma: any;

  beforeEach(() => {
    prisma = { user: { findFirst: jest.fn() } };
    service = new WhatsAppService(prisma);
  });

  it('should create valid WhatsAppResponse structure', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      apartmentId: null,
      kvkkConsents: [{ granted: true }],
    });

    const message: WhatsAppMessage = {
      id: 'msg-1',
      from: '905321234567',
      to: '905321234568',
      body: 'test',
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    const result = await service.processMessage(message);

    expect(result).toEqual(expect.objectContaining({
      messaging_product: 'whatsapp',
      to: '905321234567',
      type: 'text',
      text: expect.objectContaining({
        body: expect.any(String),
      }),
    }));
  });
});