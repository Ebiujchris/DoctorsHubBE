import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto, LoginDto, GoogleLoginDto, AuthResponseDto, UserResponseDto } from './dto/auth.dto';
import { GoogleOAuthStrategy } from './google-oauth.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private googleOAuthStrategy: GoogleOAuthStrategy,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, phone, role, specialty } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      specialty: specialty || null, // Save specialty if provided
    });

    await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.formatUserResponse(user),
      access_token: token,
      token_type: 'Bearer',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.formatUserResponse(user),
      access_token: token,
      token_type: 'Bearer',
    };
  }

  async googleLogin(googleLoginDto: GoogleLoginDto): Promise<AuthResponseDto> {
    const { idToken } = googleLoginDto;

    // Verify Google OAuth token
    const googlePayload = await this.googleOAuthStrategy.verifyToken(idToken);

    // Find user by email (must be registered first)
    const user = await this.userRepository.findOne({ where: { email: googlePayload.email } });
    
    if (!user) {
      throw new UnauthorizedException(
        `No account found with email ${googlePayload.email}. Please register first.`,
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.formatUserResponse(user),
      access_token: token,
      token_type: 'Bearer',
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account inactive');
    }
    return user;
  }

  private generateToken(user: User): string {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    console.log('🔐 SIGNING TOKEN - Payload:', payload);
    const token = this.jwtService.sign(payload);
    console.log('🔐 SIGNED TOKEN - First 50 chars:', token.substring(0, 50));
    console.log('🔐 SIGNED TOKEN - Parts:', {
      header: token.split('.')[0],
      payload: token.split('.')[1],
      signature: token.split('.')[2]?.substring(0, 20) + '...'
    });
    return token;
  }

  private formatUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      specialty: user.specialty,
      profilePicture: user.profilePicture,
      bio: user.bio,
      rating: user.rating,
      reviews: user.reviews,
      experience: user.experience,
      responseTime: user.responseTime,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
