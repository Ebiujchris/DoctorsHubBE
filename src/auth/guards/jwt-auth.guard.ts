import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: any) {
    const request = context.switchToHttp().getRequest() as Request;
    
    console.log('🔒 JWT GUARD CHECKING REQUEST');
    console.log('🔒 URL:', request.url);
    console.log('🔒 Method:', request.method);
    console.log('🔒 Authorization header:', request.headers.authorization ? 'Present' : '❌ MISSING');
    
    if (request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      console.log('🔒 Auth header format:', {
        parts: parts.length,
        scheme: parts[0],
        tokenLength: parts[1]?.length || 0,
        tokenPreview: parts[1] ? parts[1].substring(0, 50) + '...' : 'N/A'
      });
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🔒 JWT GUARD HANDLE REQUEST');
    console.log('🔒 Error:', err);
    console.log('🔒 User:', user);
    console.log('🔒 Info:', info);

    if (err || !user) {
      const errorMessage = err?.message || info?.message || 'JWT validation failed';
      console.error('❌ JWT GUARD REJECTED:', errorMessage);
      
      // Log specific JWT errors
      if (errorMessage.includes('expired')) {
        console.error('⏰ TOKEN EXPIRED - User needs to login again');
      } else if (errorMessage.includes('signature')) {
        console.error('🔑 SIGNATURE MISMATCH - Secret verification failed');
      } else if (errorMessage.includes('malformed')) {
        console.error('📝 MALFORMED TOKEN - Token format is invalid');
      }
      
      throw new UnauthorizedException(`JWT Error: ${errorMessage}`);
    }

    console.log('✅ JWT GUARD ACCEPTED - User:', user.email);
    return user;
  }
}
