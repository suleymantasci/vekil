import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting: 100 req/min
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60000, limit: 100 }],
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}