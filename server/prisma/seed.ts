-- ============================================================
-- Vekil Seed Script: Initial Permissions & Default Roles
-- ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Vekil database...');

  // ============================================
  // 1. Create Permissions
  // ============================================
  const permissions = [
    // Users
    { name: 'users:create', resource: 'users', action: 'create', description: 'Kullanıcı oluşturma' },
    { name: 'users:read', resource: 'users', action: 'read', description: 'Kullanıcı görüntüleme' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Kullanıcı güncelleme' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Kullanıcı silme' },
    
    // Buildings
    { name: 'buildings:create', resource: 'buildings', action: 'create', description: 'Bina oluşturma' },
    { name: 'buildings:read', resource: 'buildings', action: 'read', description: 'Bina görüntüleme' },
    { name: 'buildings:update', resource: 'buildings', action: 'update', description: 'Bina güncelleme' },
    { name: 'buildings:delete', resource: 'buildings', action: 'delete', description: 'Bina silme' },
    
    // Apartments
    { name: 'apartments:create', resource: 'apartments', action: 'create', description: 'Daire oluşturma' },
    { name: 'apartments:read', resource: 'apartments', action: 'read', description: 'Daire görüntüleme' },
    { name: 'apartments:update', resource: 'apartments', action: 'update', description: 'Daire güncelleme' },
    { name: 'apartments:delete', resource: 'apartments', action: 'delete', description: 'Daire silme' },
    
    // Organizations
    { name: 'organizations:read', resource: 'organizations', action: 'read', description: 'Organizasyon görüntüleme' },
    { name: 'organizations:update', resource: 'organizations', action: 'update', description: 'Organizasyon güncelleme' },
    
    // Roles
    { name: 'roles:create', resource: 'roles', action: 'create', description: 'Rol oluşturma' },
    { name: 'roles:read', resource: 'roles', action: 'read', description: 'Rol görüntüleme' },
    { name: 'roles:update', resource: 'roles', action: 'update', description: 'Rol güncelleme' },
    { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Rol silme' },
    
    // Assets
    { name: 'assets:create', resource: 'assets', action: 'create', description: 'Demirbaş oluşturma' },
    { name: 'assets:read', resource: 'assets', action: 'read', description: 'Demirbaş görüntüleme' },
    { name: 'assets:update', resource: 'assets', action: 'update', description: 'Demirbaş güncelleme' },
    { name: 'assets:delete', resource: 'assets', action: 'delete', description: 'Demirbaş silme' },
    
    // Work Orders
    { name: 'workorders:create', resource: 'work_orders', action: 'create', description: 'İş emri oluşturma' },
    { name: 'workorders:read', resource: 'work_orders', action: 'read', description: 'İş emri görüntüleme' },
    { name: 'workorders:update', resource: 'work_orders', action: 'update', description: 'İş emri güncelleme' },
    { name: 'workorders:delete', resource: 'work_orders', action: 'delete', description: 'İş emri silme' },
    
    // Audit Logs
    { name: 'auditlogs:read', resource: 'audit_logs', action: 'read', description: 'Denetim kayıtlarını görüntüleme' },
    
    // KVKK
    { name: 'kvkk:manage', resource: 'kvkk', action: 'manage', description: 'KVKK onaylarını yönetme' },

    // === PHASE 2: FINANCE PERMISSIONS ===

    // Tahakkuk Rules
    { name: 'tahakkuk:rules:create', resource: 'tahakkuk_rules', action: 'create', description: 'Aidat kuralı oluşturma' },
    { name: 'tahakkuk:rules:read', resource: 'tahakkuk_rules', action: 'read', description: 'Aidat kurallarını görüntüleme' },
    { name: 'tahakkuk:rules:update', resource: 'tahakkuk_rules', action: 'update', description: 'Aidat kuralı güncelleme' },
    { name: 'tahakkuk:rules:delete', resource: 'tahakkuk_rules', action: 'delete', description: 'Aidat kuralı silme' },

    // Charges (Tahakkuk)
    { name: 'charges:read', resource: 'charges', action: 'read', description: 'Borçları görüntüleme' },
    { name: 'charges:create', resource: 'charges', action: 'create', description: 'Borç oluşturma' },
    { name: 'charges:update', resource: 'charges', action: 'update', description: 'Borç güncelleme' },
    { name: 'charges:delete', resource: 'charges', action: 'delete', description: 'Borç silme' },
    { name: 'charges:generate', resource: 'charges', action: 'generate', description: 'Tahakkuk (borç) oluşturma' },

    // Late Fees
    { name: 'latefees:read', resource: 'late_fees', action: 'read', description: 'Gecikme faizi görüntüleme' },
    { name: 'latefees:calculate', resource: 'late_fees', action: 'calculate', description: 'Gecikme faizi hesaplama' },
    { name: 'latefees:waive', resource: 'late_fees', action: 'waive', description: 'Gecikme faizi silme/affetme' },

    // Payments
    { name: 'payments:read', resource: 'payments', action: 'read', description: 'Ödemeleri görüntüleme' },
    { name: 'payments:create', resource: 'payments', action: 'create', description: 'Ödeme kaydetme' },
    { name: 'payments:delete', resource: 'payments', action: 'delete', description: 'Ödeme silme' },

    // Invoices
    { name: 'invoices:read', resource: 'invoices', action: 'read', description: 'Fatura/makbuz görüntüleme' },
    { name: 'invoices:create', resource: 'invoices', action: 'create', description: 'Fatura/makbuz oluşturma' },
    { name: 'invoices:update', resource: 'invoices', action: 'update', description: 'Fatura güncelleme' },
    { name: 'invoices:delete', resource: 'invoices', action: 'delete', description: 'Fatura silme' },
    { name: 'invoices:send', resource: 'invoices', action: 'send', description: 'Fatura gönderme' },
  ];

  console.log('📝 Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ ${permissions.length} permissions created/verified`);

  // ============================================
  // 2. Create System Roles (Super Admin only)
  // ============================================
  console.log('📝 Creating system roles...');
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Süper yönetici - tüm sistem ve tüm organizasyonlara erişim',
      isSystem: true,
    },
  });

  // Assign ALL permissions to SUPER_ADMIN
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }
  console.log('✅ SUPER_ADMIN role created with all permissions');

  // ============================================
  // 3. Create KVKK Permission Group (for Phase 2)
  // ============================================
  console.log('📝 Creating finance roles...');

  const orgAdminRole = await prisma.role.upsert({
    where: { name: 'ORGANIZATION_ADMIN' },
    update: {},
    create: {
      name: 'ORGANIZATION_ADMIN',
      description: 'Kurum yöneticisi - tüm yetkilere sahip',
      isSystem: true,
    },
  });

  // Organization admin gets all finance permissions too
  const financePerms = allPermissions.filter(p => 
    ['tahakkuk', 'charges', 'latefees', 'payments', 'invoices'].includes(p.resource)
  );
  
  for (const perm of financePerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: orgAdminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: orgAdminRole.id, permissionId: perm.id },
    });
  }
  console.log('✅ ORGANIZATION_ADMIN role updated with finance permissions');

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });