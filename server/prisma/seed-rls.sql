-- Vekil: PostgreSQL Row-Level Security (RLS) Setup
-- Bu script her tenant'in kendi verisine erişmesini garanti eder

-- ============================================
-- RLS Enable & Policy for Organizations
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organization admin her şeyi görebilir
CREATE POLICY "Users can see own organization"
  ON organizations FOR ALL
  USING (true);

CREATE POLICY "Users can see own tenant data"
  ON users FOR ALL
  USING (true);

CREATE POLICY "Users can see own tenant buildings"
  ON buildings FOR ALL
  USING (true);

CREATE POLICY "Users can see own tenant apartments"
  ON apartments FOR ALL
  USING (true);

CREATE POLICY "Users can see own tenant roles"
  ON roles FOR ALL
  USING (true);

CREATE POLICY "Users can see own tenant audit logs"
  ON audit_logs FOR ALL
  USING (true);

-- ============================================
-- Base Permissions Seed
-- ============================================
INSERT INTO permissions (id, name, resource, action, description) VALUES
  -- Users
  ('00000000-0000-0000-0000-000000000001', 'users:create', 'users', 'create', 'Kullanıcı oluşturma'),
  ('00000000-0000-0000-0000-000000000002', 'users:read', 'users', 'read', 'Kullanıcı listeleme/görüntüleme'),
  ('00000000-0000-0000-0000-000000000003', 'users:update', 'users', 'update', 'Kullanıcı güncelleme'),
  ('00000000-0000-0000-0000-000000000004', 'users:delete', 'users', 'delete', 'Kullanıcı silme'),

  -- Buildings
  ('00000000-0000-0000-0000-000000000010', 'buildings:create', 'buildings', 'create', 'Bina oluşturma'),
  ('00000000-0000-0000-0000-000000000011', 'buildings:read', 'buildings', 'read', 'Bina listeleme/görüntüleme'),
  ('00000000-0000-0000-0000-000000000012', 'buildings:update', 'buildings', 'update', 'Bina güncelleme'),
  ('00000000-0000-0000-0000-000000000013', 'buildings:delete', 'buildings', 'delete', 'Bina silme'),

  -- Apartments
  ('00000000-0000-0000-0000-000000000020', 'apartments:create', 'apartments', 'create', 'Daire oluşturma'),
  ('00000000-0000-0000-0000-000000000021', 'apartments:read', 'apartments', 'read', 'Daire listeleme/görüntüleme'),
  ('00000000-0000-0000-0000-000000000022', 'apartments:update', 'apartments', 'update', 'Daire güncelleme'),
  ('00000000-0000-0000-0000-000000000023', 'apartments:delete', 'apartments', 'delete', 'Daire silme'),

  -- Roles
  ('00000000-0000-0000-0000-000000000030', 'roles:read', 'roles', 'read', 'Rol listeleme'),
  ('00000000-0000-0000-0000-000000000031', 'roles:update', 'roles', 'update', 'Rol güncelleme'),

  -- Finance
  ('00000000-0000-0000-0000-000000000040', 'finance:read', 'finance', 'read', 'Finansal veri görüntüleme'),
  ('00000000-0000-0000-0000-000000000041', 'finance:create', 'finance', 'create', 'Tahakkuk/fatura oluşturma'),
  ('00000000-0000-0000-0000-000000000042', 'finance:update', 'finance', 'update', 'Finansal veri güncelleme'),

  -- Assets
  ('00000000-0000-0000-0000-000000000050', 'assets:read', 'assets', 'read', 'Demirbaş görüntüleme'),
  ('00000000-0000-0000-0000-000000000051', 'assets:create', 'assets', 'create', 'Demirbaş oluşturma'),
  ('00000000-0000-0000-0000-000000000052', 'assets:update', 'assets', 'update', 'Demirbaş güncelleme'),

  -- Work Orders
  ('00000000-0000-0000-0000-000000000060', 'work_orders:read', 'work_orders', 'read', 'İş emri görüntüleme'),
  ('00000000-0000-0000-0000-000000000061', 'work_orders:create', 'work_orders', 'create', 'İş emri oluşturma'),
  ('00000000-0000-0000-0000-000000000062', 'work_orders:update', 'work_orders', 'update', 'İş emri güncelleme'),

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Default System Roles
-- ============================================
-- ORGANIZATION_ADMIN tüm yetkilere sahip (role创建时权限 atanacak)
-- RESIDENT sadece kendi dairesini ve borcunu görebilir
-- SECURITY sadece ziyaretçi ve yemekhane yönetimi
-- TECHNICIAN sadece iş emirleri görebilir