import { Request, Response, NextFunction } from 'express';
import { Injectable } from '@nestjs/common';

// Functional middleware factory - avoids class constructor issues with Express
@Injectable()
export class RequestContextMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    (req as any).clientIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    next();
  }
}

export const createRequestContextMiddleware = (): (req: Request, res: Response, next: NextFunction) => void => {
  return (req: Request, res: Response, next: NextFunction): void => {
    (req as any).clientIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    next();
  };
};
