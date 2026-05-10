import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException(
      'Çok fazla istek. Lütfen biraz bekleyin.',
    );
  }

  protected async getTracker(req: any): Promise<string> {
    // Use IP as tracker for auth endpoints (no user context yet)
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }
}