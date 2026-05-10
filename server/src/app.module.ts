import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Common
import { RateLimitService } from './common/services/rate-limit.service';
import { AuthThrottlerGuard } from './common/guards/auth-throttler.guard';
import { AuthenticatedThrottlerGuard } from './common/guards/authenticated-throttler.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BuildingsModule } from './buildings/buildings.module';
import { ApartmentsModule } from './apartments/apartments.module';
import { RolesModule } from './roles/roles.module';
import { PrismaModule } from './auth/prisma.module';

// Finance Modules (Phase 2)
import { TahakkukModule } from './tahakkuk/tahakkuk.module';
import { PaymentsModule } from './payments/payments.module';
import { LateFeesModule } from './late-fees/late-fees.module';

// Phase 3 Modules
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { AssetsModule } from './assets/assets.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

// Phase 4 Modules
import { ReservationsModule } from './reservations/reservations.module';
import { MeetingsModule } from './meetings/meetings.module';
import { VotesModule } from './votes/votes.module';
import { PurchasesModule } from './purchases/purchases.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting configuration
    // - Auth endpoints: handled by AuthThrottlerGuard (IP-based, route-specific)
    // - Authenticated endpoints: handled by AuthenticatedThrottlerGuard (user-based, 500/min)
    // - Global fallback: 500 req/min per IP
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          { 
            ttl: 60000,  // 1 minute window
            limit: 500,  // 500 req/min - high enough for growth, protects against abuse
          },
        ],
        // Use IP for tracking (authenticated endpoints override with user ID in guard)
        getTracker: (req) => req.ip || req.socket?.remoteAddress || '127.0.0.1',
      }),
    }),

    // JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),

    // Global Prisma Module
    PrismaModule,

    // Common Services & Guards
    RateLimitService,
    AuthThrottlerGuard,
    AuthenticatedThrottlerGuard,
    JwtAuthGuard,

    // Feature Modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    BuildingsModule,
    ApartmentsModule,
    RolesModule,

    // Finance Modules (Phase 2)
    TahakkukModule,
    PaymentsModule,
    LateFeesModule,

    // Phase 3 Modules
    WorkOrdersModule,
    AssetsModule,
    WhatsAppModule,

    // Phase 4 Modules
    ReservationsModule,
    MeetingsModule,
    VotesModule,
    PurchasesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}