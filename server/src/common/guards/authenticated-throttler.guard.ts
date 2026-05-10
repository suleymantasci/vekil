import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

/**
 * Rate limiter for authenticated endpoints.
 * Uses user ID for tracking (not IP) to allow multiple users from same IP.
 * 
 * Limits:
 * - Authenticated API: 500 req/min per user
 * - Higher limit allows legitimate usage without blocking corporate VPNs
 * 
 * Also handles bot detection for crawlers.
 */
@Injectable()
export class AuthenticatedThrottlerGuard extends ThrottlerGuard {
  private readonly AUTHENTICATED_LIMIT = 500; // 500 req/min per user
  private readonly WINDOW_MS = 60000; // 1 minute

  private storage = new Map<string, { count: number; resetTime: number }>();

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new HttpException(
      'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  protected async getTracker(req: any): Promise<string> {
    // Use user ID if authenticated, otherwise fallback to IP
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    // Fallback to IP for unauthenticated requests
    return `ip:${req.ip || req.socket?.remoteAddress || '127.0.0.1'}`;
  }

  protected async check(name: string, context: ExecutionContext, ttl: number, limit: number): Promise<number> {
    // Skip rate limiting for bots
    if (this.isBotRequest(context)) {
      return limit;
    }
    return super.check(name, context, ttl, limit);
  }

  protected async shouldThrow(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tracker = await this.getTracker(request);
    const now = Date.now();

    let record = this.storage.get(tracker);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.WINDOW_MS };
      this.storage.set(tracker, record);
    }

    record.count++;

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', this.AUTHENTICATED_LIMIT);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, this.AUTHENTICATED_LIMIT - record.count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > this.AUTHENTICATED_LIMIT) {
      await this.throwThrottlingException(context);
    }

    return record.count <= this.AUTHENTICATED_LIMIT;
  }

  private isBotRequest(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'] || '';

    const botPatterns = [
      'googlebot', 'google-inspectiontool', 'bingbot', 'msnbot',
      'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
      'facebookexternalhit', 'facebookplatform', 'twitterbot',
      'linkedinbot', 'applebot', 'amazonbot', 'gptbot', 'ccbot',
      'anthropic-ai', '-Claude', 'GPTBot', 'MJ12bot', 'semrush',
    ];

    const ua = userAgent.toLowerCase();
    return botPatterns.some(bot => ua.includes(bot.toLowerCase()));
  }

  /**
   * Cleanup expired entries (call from cron or on interval)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.storage.entries()) {
      if (now > record.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Get storage stats for monitoring
   */
  getStats(): { activeTrackers: number; cleanupRequired: boolean } {
    return {
      activeTrackers: this.storage.size,
      cleanupRequired: this.storage.size > 100000, // Cleanup if > 100k entries
    };
  }
}