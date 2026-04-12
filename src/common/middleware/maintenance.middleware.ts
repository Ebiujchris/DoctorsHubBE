import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from '../../admin/system-settings.entity';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  private isDbAvailable = true;
  private lastDbCheck = 0;
  private readonly DB_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(
    @InjectRepository(SystemSettings)
    private settingsRepository: Repository<SystemSettings>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip maintenance check for admin routes, health checks, and static assets
    if (req.path.startsWith('/admin') || 
        req.path.startsWith('/health') || 
        req.path.startsWith('/_next') ||
        req.path.startsWith('/favicon') ||
        req.path.includes('.') ||
        req.method === 'OPTIONS') {
      return next();
    }

    // If database was unavailable recently, skip check for a while
    const now = Date.now();
    if (!this.isDbAvailable && (now - this.lastDbCheck) < this.DB_CHECK_INTERVAL) {
      return next();
    }

    try {
      // Try to check maintenance mode with a very short timeout
      const settings = await Promise.race([
        this.settingsRepository.findOne({ where: { id: 1 } }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 500)
        )
      ]) as SystemSettings;
      
      this.isDbAvailable = true;
      this.lastDbCheck = now;
      
      if (settings && settings.maintenanceMode) {
        return res.status(503).json({
          statusCode: 503,
          message: 'System is currently under maintenance',
          maintenanceMessage: settings.maintenanceMessage || 'We are performing scheduled maintenance. Please check back later.',
          error: 'Service Unavailable'
        });
      }
    } catch (error) {
      // Mark DB as unavailable and allow requests to continue
      this.isDbAvailable = false;
      this.lastDbCheck = now;
      
      // Only log once per interval to avoid spam
      if ((now - this.lastDbCheck) > this.DB_CHECK_INTERVAL) {
        console.log('⚠️ Maintenance check skipped - DB not available:', error.message);
      }
    }

    next();
  }
}