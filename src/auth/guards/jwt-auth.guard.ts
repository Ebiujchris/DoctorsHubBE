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

    if (err) {
      console.error('❌ JWT GUARD ERROR:', err.message);
      throw err;
    }
    
    if (!user) {
      const errorMessage = info?.message || 'JWT validation failed';
      console.error('❌ JWT GUARD REJECTED:', errorMessage);
      
      // Log specific JWT errors with helpful messages
      if (errorMessage.includes('expired')) {
        console.error('⏰ TOKEN EXPIRED - User needs to login again');
        throw new UnauthorizedException('Token expired. Please login again.');
      } else if (errorMessage.includes('signature')) {
        console.error('🔑 SIGNATURE MISMATCH - Secret verification failed');
        throw new UnauthorizedException('Invalid token signature. Please login again.');
      } else if (errorMessage.includes('malformed')) {
        console.error('📝 MALFORMED TOKEN - Token format is invalid');
        throw new UnauthorizedException('Invalid token format. Please login again.');
      } else if (errorMessage.includes('no auth') || !info) {
        console.error('🚫 NO AUTHORIZATION HEADER - Missing Authorization header');
        throw new UnauthorizedException('No authorization token provided. Please login.');
      }
      
      throw new UnauthorizedException(`JWT Error: ${errorMessage}`);
    }

    console.log('✅ JWT GUARD ACCEPTED - User:', user.email || user.id);
    return user;
  }
}
