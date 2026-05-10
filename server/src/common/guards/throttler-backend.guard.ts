import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ThrottlerBackendGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise fallback to IP
    // Note: req.user is added by Passport deserializeUser
    const user = req.user as { id?: string } | undefined;
    
    if (user?.id) {
      return `user:${user.id}`;
    }
    // Fallback to IP
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }
}