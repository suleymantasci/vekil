import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Set tenant context for RLS
    await this.prisma.setTenantContext(payload.org);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        organization: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya pasif');
    }

    // Extract permission names
    const permissions = user.role?.permissions?.map((rp: { permission: { name: string } }) => rp.permission.name) || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      roleId: user.roleId,
      roleName: user.role?.name,
      permissions,
    };
  }
}