import { Module, Global } from '@nestjs/common';
import { RateLimitService } from './services/rate-limit.service';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { AuthenticatedThrottlerGuard } from './guards/authenticated-throttler.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global()
@Module({
  providers: [
    RateLimitService,
    AuthThrottlerGuard,
    AuthenticatedThrottlerGuard,
    JwtAuthGuard,
  ],
  exports: [
    RateLimitService,
    AuthThrottlerGuard,
    AuthenticatedThrottlerGuard,
    JwtAuthGuard,
  ],
})
export class CommonModule {}
