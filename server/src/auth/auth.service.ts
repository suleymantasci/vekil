import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from './prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new Error('Bu e-posta adresi zaten kayıtlı');
    }

    // 2. Check slug uniqueness
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug },
    });
    if (existingOrg) {
      throw new Error('Bu şirket slugı zaten kullanılıyor');
    }

    // 3. Create organization + admin user in transaction
    const passwordHash = await argon2.hash(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create Organization
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: dto.organizationSlug,
        },
      });

      // Create default Role (ORGANIZATION_ADMIN)
      const role = await tx.role.create({
        data: {
          name: 'ORGANIZATION_ADMIN',
          description: 'Şirket yöneticisi - tüm yetkilere sahip',
          organizationId: org.id,
        },
      });

      // Create all permissions for admin role
      const allPermissions = await tx.permission.findMany();
      await tx.rolePermission.createMany({
        data: allPermissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          roleId: role.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });

      return { organization: org, user };
    });

    // 4. Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.organization.id);

    return {
      user: this.sanitizeUser(result.user),
      organization: result.organization,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true, organization: true },
    });

    if (!user || !user.isActive) {
      throw new Error('Geçersiz e-posta veya şifre');
    }

    const validPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!validPassword) {
      throw new Error('Geçersiz e-posta veya şifre');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'LOGIN',
        resource: 'auth',
        ipAddress: '0.0.0.0', // Will be set via interceptor
      },
    });

    const tokens = await this.generateTokens(user.id, user.organizationId);

    return {
      user: this.sanitizeUser(user),
      organization: user.organization,
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { organization: true, role: true } } },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new Error('Geçersiz veya süresi dolmuş refresh token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: refreshToken.id } });

    // Generate new tokens
    const tokens = await this.generateTokens(refreshToken.user.id, refreshToken.user.organizationId);

    return {
      user: this.sanitizeUser(refreshToken.user),
      ...tokens,
    };
  }

  private async generateTokens(userId: string, organizationId: string) {
    const payload = { sub: userId, org: organizationId };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshTokenValue = uuidv4();
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt: refreshTokenExpiry,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, tcNo, ...safe } = user;
    return safe;
  }
}