import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: configService.get('NODE_ENV') === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set the current tenant context for RLS policies.
   * Called by JwtStrategy on each authenticated request.
   */
  async setTenantContext(tenantId: string): Promise<void> {
    await this.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  }

  /**
   * Clear tenant context (logout)
   */
  async clearTenantContext(): Promise<void> {
    await this.$executeRaw`SELECT set_config('app.current_tenant', '', true)`;
  }
}