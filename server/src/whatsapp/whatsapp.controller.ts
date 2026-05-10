import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WhatsAppService, WhatsAppMessage } from './whatsapp.service';

/**
 * WhatsApp Webhook Controller
 * 
 * Meta WhatsApp Business API webhook'leri buraya gelir.
 * İki tip istek gelir:
 * 1. GET - Webhook verification (Meta validation)
 * 2. POST - Gelen mesajlar
 */
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  /**
   * GET /whatsapp - Webhook verification
   * Meta platformunun webhook'u doğrulaması için
   */
  @Get('webhook')
  async webhookVerification(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      console.log('WhatsApp webhook verified successfully');
      return { challenge };
    }

    throw new UnauthorizedException('Webhook verification failed');
  }

  /**
   * POST /whatsapp/webhook - Gelen mesajları işle
   */
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    // Meta WhatsApp payload yapısı
    if (body.object !== 'whatsapp_business_account') {
      return { status: 'ignored' };
    }

    const entries = body.entry?.[0]?.changes?.[0]?.value;
    if (!entries?.messages) {
      return { status: 'ignored' };
    }

    const results = [];
    for (const entry of entries.messages || []) {
      const message: WhatsAppMessage = {
        id: entry.id,
        from: entry.from,
        to: entry.to,
        body: entry.text?.body || '',
        timestamp: entry.timestamp,
        type: entry.type,
      };

      const response = await this.whatsappService.processMessage(message);
      if (response) {
        results.push(response);
      }
    }

    return { status: 'processed', responses: results.length };
  }

  /**
   * POST /whatsapp/send - Manuel mesaj gönder (test için)
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('send')
  async sendMessage(
    @Body() body: { to: string; message: string },
  ) {
    const response = await this.whatsappService.processMessage({
      id: 'manual-' + Date.now(),
      from: process.env.WHATSAPP_PHONE_NUMBER || '',
      to: body.to,
      body: body.message,
      timestamp: new Date().toISOString(),
      type: 'text',
    });

    return response;
  }

  /**
   * POST /whatsapp/opt-in - KVKK onayı al
   */
  @Post('opt-in')
  async optIn(
    @Body() body: { userId: string; phone: string },
  ) {
    await this.whatsappService.grantConsent(body.userId, 'whatsapp', 'chatbot', {
      ipAddress: '0.0.0.0',
      userAgent: 'WhatsApp',
    });

    return { success: true, message: 'KVKK onayı başarıyla alındı' };
  }
}

// Extend WhatsAppService with consent method
declare module './whatsapp.service' {
  interface WhatsAppService {
    grantConsent(userId: string, channel: string, purpose: string, metadata: any): Promise<void>;
  }
}