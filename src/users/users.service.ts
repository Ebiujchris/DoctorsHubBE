import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async searchProviders(specialty: string, location: string): Promise<User[]> {
    let query = this.userRepository.createQueryBuilder('user');

    // Filter by active and verified
    query = query.where('user.isActive = :isActive', { isActive: true });
    query = query.andWhere('user.isVerified = :isVerified', { isVerified: true });

    // Filter by provider roles (exclude patients)
    query = query.andWhere('user.role IN (:...roles)', {
      roles: [UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER]
    });

    // Filter by specialty if provided
    if (specialty && specialty !== 'all') {
      query = query.andWhere('(user.specialty LIKE :specialty OR user.role = :role)', {
        specialty: `%${specialty}%`,
        role: specialty.toLowerCase()
      });
    }

    // Sort by rating
    query = query.orderBy('user.rating', 'DESC');

    return query.getMany();
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
  }

  async activate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: true });
  }

  async verify(id: string): Promise<void> {
    await this.userRepository.update(id, { isVerified: true });
  }
}
