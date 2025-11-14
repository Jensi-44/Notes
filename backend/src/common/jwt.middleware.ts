import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}
  use(req: Request & { userId?: string }, res: Response, next: NextFunction) {
    const header = req.headers['authorization'] as string;
    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7);
      const payload = this.authService.verifyToken(token);
      if (payload?.sub) req.userId = payload.sub;
    }
    next();
  }
}
