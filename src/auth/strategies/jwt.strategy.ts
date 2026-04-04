import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly jwtSecret: string;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    console.log('🔐 JwtStrategy INITIALIZING');
    console.log('🔐 Secret from ConfigService:', jwtSecret ? `${jwtSecret.length} chars` : 'UNDEFINED');
    console.log('🔐 Secret preview:', jwtSecret?.substring(0, 30) + '...');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || process.env.JWT_SECRET || 'default_secret',
    });
    
    this.jwtSecret = jwtSecret;
    console.log('🔐 JwtStrategy initialized - ready to validate tokens');
  }

  async validate(payload: any) {
    console.log('🔐 VALIDATING TOKEN');
    console.log('🔐 Decoded payload:', { sub: payload.sub, email: payload.email });
    console.log('🔐 Payload exp:', payload.exp, new Date(payload.exp * 1000).toISOString());
    
    try {
      const user = await this.authService.validateUser(payload.sub);
      console.log('✅ TOKEN VALIDATED SUCCESSFULLY - User:', payload.email);
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      console.error('❌ TOKEN VALIDATION FAILED:', error.message);
      throw new UnauthorizedException('Token validation failed: ' + error.message);
    }
  }
}
