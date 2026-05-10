import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthThrottlerGuard } from '../common/guards/auth-throttler.guard';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(AuthThrottlerGuard)
  async register(@Body() dto: RegisterDto) {
    try {
      const result = await this.authService.register(dto);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.authService.login(dto);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      const result = await this.authService.refreshToken(dto.refreshToken);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message);
    }
  }
}