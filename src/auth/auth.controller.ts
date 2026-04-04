import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GoogleLoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google-login')
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    console.log('✅ Profile endpoint called successfully with user:', req.user.email);
    return req.user;
  }

  @Get('test-auth')
  @UseGuards(JwtAuthGuard)
  async testAuth(@Request() req) {
    console.log('✅ Auth test endpoint - User authenticated:', req.user);
    return {
      message: 'JWT is working correctly!',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
}
