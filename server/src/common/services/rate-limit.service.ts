import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

/**
 * In-memory rate limiter with bot detection.
 * Used for auth endpoints with route-specific limits.
 * 
 * For production with multiple instances, use Redis-based solution.
 */
@Injectable()
export class RateLimitService {
  private storage = new Map<string, { count: number; resetTime: number }>();
  private readonly WINDOW_MS = 60000; // 1 minute

  // Route-specific limits (per IP)
  private limits = {
    login: 30,
    register: 10,
    refresh: 20,
    default: 60,
  };

  /**
   * Check rate limit for a given key (usually IP or user ID)
   * @param key Unique identifier (IP for auth, user ID for authenticated)
   * @param route Route name for route-specific limits
   * @param customLimit Optional custom limit override
   */
  check(key: string, route?: string, customLimit?: number): { allowed: boolean; remaining: number; resetIn: number } {
    const limit = customLimit || this.getLimitForRoute(route || '');
    const now = Date.now();

    let record = this.storage.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.WINDOW_MS };
      this.storage.set(key, record);
    }

    record.count++;

    const remaining = Math.max(0, limit - record.count);
    const resetIn = Math.ceil((record.resetTime - now) / 1000);

    if (record.count > limit) {
      throw new HttpException(
        `Çok fazla istek. ${resetIn} saniye sonra tekrar deneyin.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return { allowed: true, remaining, resetIn };
  }

  /**
   * Check rate limit from request (extracts IP and route from request)
   */
  checkRequest(request: any, route?: string): { allowed: boolean; remaining: number; resetIn: number } {
    const ip = this.getClientIP(request);
    return this.check(ip, route);
  }

  /**
   * Set rate limit headers on response
   */
  setHeaders(response: any, remaining: number, resetIn: number, limit: number): void {
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetIn));
  }

  private getLimitForRoute(route: string): number {
    if (route.includes('login')) return this.limits.login;
    if (route.includes('register')) return this.limits.register;
    if (route.includes('refresh')) return this.limits.refresh;
    return this.limits.default;
  }

  private getClientIP(request: any): string {
    return (
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      request.connection?.remoteAddress ||
      '127.0.0.1'
    );
  }

  /**
   * Check User-Agent header to detect bots
   * Call this before check() to determine if request should be exempted
   */
  isBotRequest(userAgent: string): boolean {
    if (!userAgent) return false;

    const bots = [
      'googlebot', 'google-inspectiontool', 'bingbot', 'msnbot',
      'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
      'facebookexternalhit', 'facebookplatform', 'twitterbot',
      'linkedinbot', 'applebot', 'amazonbot', 'gptbot', 'ccbot',
      'anthropic-ai', '-Claude', 'GPTBot', 'MJ12bot',
    ];

    const ua = userAgent.toLowerCase();
    return bots.some(bot => ua.includes(bot.toLowerCase()));
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.storage.forEach((record, key) => {
      if (now > record.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.storage.delete(key));
  }

  /**
   * Get current stats for monitoring
   */
  getStats(): { activeKeys: number; cleanupRequired: boolean } {
    return {
      activeKeys: this.storage.size,
      cleanupRequired: this.storage.size > 10000,
    };
  }
}