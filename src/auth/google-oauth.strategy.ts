import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

@Injectable()
export class GoogleOAuthStrategy {
  private googleAudience: string;

  constructor(private configService: ConfigService) {
    this.googleAudience = this.configService.get('GOOGLE_CLIENT_ID') || '';
  }

  /**
   * Verify Google OAuth token (ID token from Google SDK)
   * In production, validate the signature using Google's public keys.
   * For now, we'll decode and verify the structure.
   */
  async verifyToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      // Decode the JWT without verification (frontend handles verification with Google)
      // In production, you'd validate the signature using google-auth-library
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const decodedPayload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8'),
      );

      // Verify token hasn't expired
      if (decodedPayload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return decodedPayload as GoogleTokenPayload;
    } catch (error) {
      throw new Error(`Google token verification failed: ${error.message}`);
    }
  }
}
