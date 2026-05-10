import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

/**
 * Auth-specific throttler with route-based limits and bot detection.
 * 
 * Limits:
 * - Login: 30 req/min per IP (tolerant for VPN/corporate networks)
 * - Register: 10 req/min per IP (spam protection)
 * - Refresh: 20 req/min per IP
 * - Global auth: 60 req/min per IP
 * 
 * Bots (Googlebot, Bing, etc.) are exempt from rate limiting.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  private readonly LOGIN_LIMIT = 30;
  private readonly REGISTER_LIMIT = 10;
  private readonly REFRESH_LIMIT = 20;
  private readonly AUTH_GLOBAL_LIMIT = 60;

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new HttpException(
      'Çok fazla istek. Lütfen biraz bekleyin.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  protected async getTracker(req: any): Promise<string> {
    // IP-based tracking for auth endpoints
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }

  protected async checkImpl(context: ExecutionContext, ttl: number, limit: number): Promise<number> {
    // Skip rate limiting for bots/crawlers
    if (this.isBotRequest(context)) {
      return limit; // Return full limit (effectively no throttling)
    }
    return super.check(null as any, context, ttl, limit);
  }

  protected getRouteFromContext(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return request.route?.path || request.url || '';
  }

  protected getLimitForRoute(route: string): number {
    if (route.includes('login')) return this.LOGIN_LIMIT;
    if (route.includes('register')) return this.REGISTER_LIMIT;
    if (route.includes('refresh')) return this.REFRESH_LIMIT;
    return this.AUTH_GLOBAL_LIMIT;
  }

  private isBotRequest(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'] || '';

    // Known bot patterns
    const botPatterns = [
      'googlebot',
      'google-inspectiontool',
      'bingbot',
      'msnbot',
      'slurp',
      'duckduckbot',
      'baiduspider',
      'yandexbot',
      'facebookexternalhit',
      'facebookplatform',
      'twitterbot',
      'linkedinbot',
      'applebot',
      'amazonbot',
      'gptbot',
      'ccbot',
      'anthropic-ai',
    ];

    return botPatterns.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
  }
}