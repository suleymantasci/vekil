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
    
    // Set database role for RLS (if configured)
    // In production, we use the app's db user which has RLS policies applied
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set the current tenant context for RLS policies.
   * Called via Prisma extension or direct SQL.
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

  /**
   * Prisma extension for automatic tenant context.
   * Use: prisma.users.findMany({}).withTenant(organizationId)
   */
  withTenant<T>(tenantId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            // For findMany, we don't modify args - tenant filtering 
            // is handled by RLS policies at the database level.
            // We just ensure the tenant context is set.
            await PrismaService.prototype.setTenantContext.call(
              { $executeRaw: PrismaClient.prototype.$executeRaw.bind({}) as any },
              tenantId
            );
            return query(args);
          },
          async create({ model, args, query }) {
            await PrismaService.prototype.setTenantContext.call(
              { $executeRaw: PrismaClient.prototype.$executeRaw.bind({}) as any },
              args.data.organizationId as string || ''
            );
            return query(args);
          },
        },
      },
    }) as any;
  }
}