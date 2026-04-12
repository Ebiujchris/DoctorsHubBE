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
    console.log('🔐 Decoded payload:', { sub: payload.sub, email: payload.email, role: payload.role });
    
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;
    
    console.log('🔐 Token expiration check:', {
      currentTime: new Date().toISOString(),
      tokenExp: payload.exp,
      tokenExpTime: new Date(payload.exp * 1000).toISOString(),
      timeRemainingSeconds: expiresIn,
      isExpired: expiresIn < 0 ? '❌ YES' : '✅ NO'
    });
    
    if (expiresIn < 0) {
      console.error('❌ TOKEN IS EXPIRED - expiresIn:', expiresIn);
    }
    
    if (!payload.sub) {
      console.error('❌ Token missing sub (user ID) claim');
      throw new UnauthorizedException('Invalid token: missing user ID');
    }
    
    try {
      // Check if this is an admin token
      if (payload.role === 'admin') {
        console.log('🔐 Admin token detected, validating admin user');
        // For admin tokens, we'll trust the payload since it was signed by our server
        const result = {
          id: payload.sub,
          sub: payload.sub,
          email: payload.email,
          role: 'admin',
          firstName: payload.name || 'Admin',
          lastName: '',
        };
        console.log('✅ Admin token validated:', { id: result.id, email: result.email, role: result.role });
        return result;
      } else {
        // Regular user validation
        const user = await this.authService.validateUser(payload.sub);
        console.log('✅ TOKEN VALIDATED SUCCESSFULLY - User:', payload.email);
        const result = {
          id: user.id,
          sub: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        console.log('✅ Returning user object:', { id: result.id, email: result.email, role: result.role });
        return result;
      }
    } catch (error) {
      console.error('❌ TOKEN VALIDATION FAILED:', error.message);
      throw new UnauthorizedException('Token validation failed: ' + error.message);
    }
  }
}
