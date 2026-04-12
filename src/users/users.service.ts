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

    // Filter by active, verified, and approved providers only
    query = query.where('user.isActive = :isActive', { isActive: true });
    query = query.andWhere('user.isVerified = :isVerified', { isVerified: true });
    query = query.andWhere('user.isApproved = :isApproved', { isApproved: true });

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

  async approve(id: string): Promise<void> {
    await this.userRepository.update(id, { isApproved: true });
  }

  async reject(id: string): Promise<void> {
    await this.userRepository.update(id, { isApproved: false });
  }

  // Admin dashboard methods
  async getTotalUsersCount(): Promise<number> {
    return this.userRepository.count();
  }

  async getProvidersCount(): Promise<number> {
    return this.userRepository.count({
      where: [
        { role: UserRole.DOCTOR },
        { role: UserRole.NURSE },
        { role: UserRole.PSYCHIATRIST },
        { role: UserRole.CARER }
      ]
    });
  }

  async getPendingProvidersCount(): Promise<number> {
    return this.userRepository.count({
      where: [
        { role: UserRole.DOCTOR, isApproved: false },
        { role: UserRole.NURSE, isApproved: false },
        { role: UserRole.PSYCHIATRIST, isApproved: false },
        { role: UserRole.CARER, isApproved: false }
      ]
    });
  }

  async getRecentUsers(limit: number = 10): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  // Admin methods for provider management
  async getProviders(page: number = 1, limit: number = 20, status: string = 'all') {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER]
      });

    if (status === 'pending') {
      query.andWhere('user.isApproved = :approved', { approved: false });
    } else if (status === 'approved') {
      query.andWhere('user.isApproved = :approved', { approved: true });
    } else if (status === 'suspended') {
      query.andWhere('user.isActive = :active', { active: false });
    }

    const total = await query.getCount();
    const providers = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      providers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    };
  }

  // Admin methods for patient management
  async getPatients(page: number = 1, limit: number = 20) {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.PATIENT });

    const total = await query.getCount();
    const patients = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      patients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    };
  }

  // Analytics methods
  async getUserGrowthData(startDate: Date) {
    try {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .select('DATE(user.createdAt) as date, COUNT(*) as count')
        .where('user.createdAt >= :startDate', { startDate })
        .groupBy('DATE(user.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return users.map(item => ({
        date: item.date,
        users: parseInt(item.count)
      }));
    } catch (error) {
      console.error('Error getting user growth data:', error);
      return [];
    }
  }

  async getPopularSpecialties() {
    try {
      const specialties = await this.userRepository
        .createQueryBuilder('user')
        .select('user.specialty, COUNT(*) as count')
        .where('user.role IN (:...roles)', {
          roles: [UserRole.DOCTOR, UserRole.NURSE, UserRole.PSYCHIATRIST, UserRole.CARER]
        })
        .andWhere('user.specialty IS NOT NULL')
        .groupBy('user.specialty')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      return specialties.map(item => ({
        specialty: item.specialty,
        count: parseInt(item.count)
      }));
    } catch (error) {
      console.error('Error getting popular specialties:', error);
      return [];
    }
  }

  // Additional methods for admin notifications
  async findByIds(userIds: string[]): Promise<User[]> {
    return this.userRepository.find({
      where: userIds.map(id => ({ id }))
    });
  }

  async findAllActiveUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true }
    });
  }
}
