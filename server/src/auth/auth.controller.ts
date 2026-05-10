import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { RateLimitService } from '../common/services/rate-limit.service';
import { AuthService } from './auth.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';

// DTOs as simple interfaces for now (validation handled by ValidationPipe)
interface RegisterDto {
  organizationName: string;
  organizationSlug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface RefreshTokenDto {
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private rateLimitService: RateLimitService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    // Rate limit check: 10 req/min for register (spam protection)
    const userAgent = req.headers['user-agent'] || '';
    
    // Skip rate limiting for bots
    if (!this.rateLimitService.isBotRequest(userAgent)) {
      this.rateLimitService.checkRequest(req, 'register');
    }

    try {
      const result = await this.authService.register(dto as any);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    // Rate limit check: 30 req/min for login (VPN/corporate tolerant)
    const userAgent = req.headers['user-agent'] || '';

    if (!this.rateLimitService.isBotRequest(userAgent)) {
      this.rateLimitService.checkRequest(req, 'login');
    }

    try {
      const result = await this.authService.login(dto as any);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    // Rate limit check: 20 req/min for refresh (replay attack protection)
    const userAgent = req.headers['user-agent'] || '';

    if (!this.rateLimitService.isBotRequest(userAgent)) {
      this.rateLimitService.checkRequest(req, 'refresh');
    }

    try {
      const result = await this.authService.refreshToken(dto.refreshToken);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }
}