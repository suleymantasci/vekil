import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId: string;
        permissions: string[];
        roleName?: string;
      };
    }
  }
}

@Injectable()
export class ThrottlerBackendGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise IP
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    // Fallback to IP
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }
}