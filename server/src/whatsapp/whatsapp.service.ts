import { Injectable } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface WhatsAppMessage {
  from: string; // Phone number
  to: string;
  body: string;
  timestamp: string;
  type: 'text' | 'image' | 'location' | 'document';
  id: string;
}

export interface WhatsAppResponse {
  messaging_product: string;
  to: string;
  type: 'text' | 'image' | 'template';
  text?: { body: string };
  template?: { name: string; language: { code: string }; components: any[] };
}

/**
 * WhatsApp Business API Entegrasyonu
 * 
 * Bu servis gelen mesajları işler ve otomatik yanıtlar üretir.
 * RAG tabanlı yapay zeka ile entegre çalışır.
 */
@Injectable()
export class WhatsAppService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gelen mesajı işle ve yanıt oluştur
   */
  async processMessage(message: WhatsAppMessage): Promise<WhatsAppResponse | null> {
    const { from, body } = message;
    const normalizedBody = body.trim().toLowerCase();

    // Kullanıcıyı telefon numarasından bul
    const user = await this.prisma.user.findFirst({
      where: {
        phoneEncrypted: false,
        phone: from,
      },
      include: {
        apartment: { include: { building: true } },
        kvkkConsents: {
          where: { channel: 'whatsapp', purpose: 'chatbot', granted: true },
        },
      },
    });

    // KVKK onayı kontrolü
    if (!user?.kvkkConsents?.length) {
      return this.createTextResponse(from, this.getKvkkConsentMessage());
    }

    // Komut analizi
    if (normalizedBody.startsWith('/')) {
      return this.handleCommand(from, normalizedBody, user);
    }

    // NLP analizi - hangi intent'e uygun?
    const intent = this.classifyIntent(normalizedBody);

    switch (intent) {
      case 'balance':
        return this.handleBalanceQuery(from, user);
      case 'payment':
        return this.handlePaymentQuery(from, user);
      case 'work_order':
        return this.handleWorkOrderQuery(from, user);
      case 'help':
        return this.handleHelp(from);
      default:
        return this.handleFallback(from, normalizedBody);
    }
  }

  /**
   * Intent sınıflandırma (basit keyword matching)
   * Gerçek uygulamada OpenAI/Gemini RAG kullanılır
   */
  private classifyIntent(message: string): string {
    const balanceKeywords = ['borcum', 'bakiye', 'ödeme', 'ne kadar', 'borç', 'hesap'];
    const paymentKeywords = ['ödeme', 'para', 'havale', 'nakit', 'kart'];
    const workOrderKeywords = ['arıza', 'tamir', 'sorun', 'problem', 'sıkıntı', 'arıza bildir'];
    const helpKeywords = ['yardim', 'yardım', 'help', 'komut', 'destek'];

    if (balanceKeywords.some((k) => message.includes(k))) return 'balance';
    if (paymentKeywords.some((k) => message.includes(k))) return 'payment';
    if (workOrderKeywords.some((k) => message.includes(k))) return 'work_order';
    if (helpKeywords.some((k) => message.includes(k))) return 'help';

    return 'unknown';
  }

  /**
   * Borç sorgulama
   */
  private async handleBalanceQuery(from: string, user: any) {
    if (!user.apartmentId) {
      return this.createTextResponse(from, 'Daire bilginiz sistemde kayıtlı değil. Lütfen yönetimle iletişime geçin.');
    }

    const balance = await this.prisma.charge.findMany({
      where: {
        apartmentId: user.apartmentId,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      include: {
        lateFees: { where: { isPaid: false } },
        payments: true,
      },
    });

    if (balance.length === 0) {
      return this.createTextResponse(from, `Merhaba ${user.firstName},\n\nBorç bulunmamaktadır. 🎉\n\nBaşka bir konuda yardımcı olabilir misiniz?`);
    }

    const totalDebt = balance.reduce((sum: number, c: any) => sum + c.amount, 0);
    const totalPaid = balance.reduce((sum: number, c: any) => sum + c.payments.reduce((s: number, p: any) => s + p.amount, 0), 0);
    const totalLateFee = balance.reduce((sum: number, c: any) => sum + c.lateFees.reduce((s: number, f: any) => s + f.amount, 0), 0);
    const remaining = totalDebt - totalPaid + totalLateFee;

    let response = `Sayın ${user.firstName} ${user.lastName},\n\n`;
    response += `📊 Borç Durumunuz:\n`;
    response += `─────────────────\n`;
    response += `Toplam Borç: ${totalDebt.toFixed(2)} ₺\n`;
    response += `Ödenen: ${totalPaid.toFixed(2)} ₺\n`;
    if (totalLateFee > 0) {
      response += `Gecikme Faizi: ${totalLateFee.toFixed(2)} ₺\n`;
    }
    response += `─────────────────\n`;
    response += `Kalan: ${remaining.toFixed(2)} ₺\n\n`;
    response += `Son ödeme tarihini kaçırmamak için zamanında ödeme yapmayı unutmayın! 💳`;

    return this.createTextResponse(from, response);
  }

  /**
   * Ödeme bilgisi sorgulama
   */
  private async handlePaymentQuery(from: string, user: any) {
    if (!user.apartmentId) {
      return this.createTextResponse(from, 'Daire bilginiz sistemde kayıtlı değil.');
    }

    const lastPayment = await this.prisma.payment.findFirst({
      where: { apartmentId: user.apartmentId },
      orderBy: { paidAt: 'desc' },
    });

    if (!lastPayment) {
      return this.createTextResponse(from, 'Sisteme kayıtlı herhangi bir ödeme bulunamadı.');
    }

    const response = `Son Ödemeniz:\n` +
      `─────────────────\n` +
      `Tarih: ${new Date(lastPayment.paidAt).toLocaleDateString('tr-TR')}\n` +
      `Tutar: ${lastPayment.amount.toFixed(2)} ₺\n` +
      `Yöntem: ${this.getPaymentMethodLabel(lastPayment.paymentMethod)}\n` +
      `─────────────────\n\n` +
      `Yeni bir ödeme yapmak için uygulama üzerinden veya yönetimle iletişime geçebilirsiniz.`;

    return this.createTextResponse(from, response);
  }

  /**
   * İş emri sorgulama
   */
  private async handleWorkOrderQuery(from: string, user: any) {
    const response = `🔧 Teknik Servis\n\n` +
      `─────────────────\n` +
      `Arıza bildirimi için uygulamamızı kullanabilirsiniz.\n\n` +
      `Bizi şu bilgilerle bilgilendirin:\n` +
      `• Arıza yeri (blok/daire)\n` +
      `• Arıza açıklaması\n` +
      `• Fotoğraf (varsa)\n\n` +
      `En kısa sürede ekibimiz size dönüş yapacaktır.`;

    return this.createTextResponse(from, response);
  }

  /**
   * Help komutu
   */
  private handleHelp(from: string): WhatsAppResponse {
    const helpText = `Vekil Asistan 🤖\n\n` +
      `Komutlar:\n` +
      `─────────────────\n` +
      `/borcum - Borç durumunuzu sorgulayın\n` +
      `/odemelerim - Son ödemelerinizi görün\n` +
      `/bildirim - Arıza bildirimi oluşturun\n` +
      `/yardim - Bu mesajı göster\n` +
      `─────────────────\n\n` +
      `Size nasıl yardımcı olabilirim?`;

    return this.createTextResponse(from, helpText);
  }

  /**
   * Komut işleme
   */
  private async handleCommand(from: string, command: string, user: any): Promise<WhatsAppResponse> {
    if (command === '/borcum') {
      return this.handleBalanceQuery(from, user);
    }
    if (command === '/odemelerim') {
      return this.handlePaymentQuery(from, user);
    }
    if (command === '/yardim' || command === '/help') {
      return this.handleHelp(from);
    }
    if (command.startsWith('/bildirim')) {
      return this.handleWorkOrderQuery(from, user);
    }

    return this.createTextResponse(from, `Bu komutu tanıyamadım: ${command}\n\n/yardim yazarak tüm komutları görebilirsiniz.`);
  }

  /**
   * Fallback - anlaşılamayan mesajlar
   */
  private handleFallback(from: string, message: string): WhatsAppResponse {
    // Basit FAQ kontrolü
    const faqResponses: Record<string, string> = {
      'merhaba': `Merhaba! 👋\nVekil asistanına hoş geldiniz.\n\nSize nasıl yardımcı olabilirim?\n\n/yardim yazarak komutları görebilirsiniz.`,
      'selam': `Selam! 👋\nSize nasıl yardımcı olabilirim?`,
      'teşekkürler': `Rica ederim! 😊\nBaşka bir konuda yardımcı olabilir misiniz?`,
      'teşekkür ederim': `Rica ederim! 😊\nBaşka bir konuda yardımcı olabilir misiniz?`,
    };

    const normalized = message.toLowerCase().trim();
    for (const [keyword, response] of Object.entries(faqResponses)) {
      if (normalized.includes(keyword)) {
        return this.createTextResponse(from, response);
      }
    }

    return this.createTextResponse(from, 
      `Mesajınızı aldım ancak tam olarak anlayamadım. 🤔\n\n/yardim yazarak kullanılabilir komutları görebilirsiniz.`
    );
  }

  /**
   * KVKK onay mesajı
   */
  private getKvkkConsentMessage(): string {
    return `Vekil WhatsApp Asistanı 🤖\n\n` +
      `Merhaba! Bu servisi kullanabilmek için KVKK kapsamında onay vermeniz gerekmektedir.\n\n` +
      `Onay vermek için: [UYGULAMA_URL]\n\n` +
      `veya yönetimle iletişime geçebilirsiniz.`;
  }

  /**
   * Text response oluştur
   */
  private createTextResponse(to: string, body: string): WhatsAppResponse {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    };
  }

  /**
   * Ödeme yöntemi label
   */
  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: '💵 Nakit',
      BANK_TRANSFER: '🏦 Banka Transferi',
      CREDIT_CARD: '💳 Kredi Kartı',
      DIGITAL_WALLET: '📱 Dijital Cüzdan',
    };
    return labels[method] || method;
  }

  /**
   * KVKK onayı ver
   */
  async grantConsent(userId: string, channel: string, purpose: string, metadata: { ipAddress?: string; userAgent?: string }): Promise<void> {
    await this.prisma.kvkKConsent.upsert({
      where: {
        userId_channel_purpose: { userId, channel, purpose },
      },
      update: {
        granted: true,
        grantedAt: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        revokedAt: null,
      },
      create: {
        userId,
        channel,
        purpose,
        granted: true,
        grantedAt: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
  }
}