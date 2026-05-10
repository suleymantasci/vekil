import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Attach IP to request object
    (req as any).clientIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    next();
  }
}