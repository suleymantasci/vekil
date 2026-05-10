import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

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

    // Rate limiting: 100 req/min global, auth endpoints override via guards
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          { ttl: 60000, limit: 100 }, // Global: 100 req/min
        ],
        // Ignore user-based tracking for auth endpoints
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
