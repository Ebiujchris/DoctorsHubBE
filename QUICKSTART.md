# Quick Start Guide - DoctorsHub Backend

## Prerequisites
- Node.js 18+ installed
- PostgreSQL installed or Docker installed
- npm or yarn package manager

## Setup Steps

### 1. Install Dependencies
```bash
cd /Users/daphnenaggayi/Desktop/DocHub/DoctorsHubBE
npm install
```

### 2. Setup PostgreSQL Database

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d
```
This will start:
- PostgreSQL on port 5432
- PgAdmin on port 5050 (admin@example.com / admin)

**Option B: Manual PostgreSQL Setup**
- Ensure PostgreSQL is running
- Create a database named `doctorshub`
- Update `.env` with your credentials

### 3. Configure Environment Variables
```bash
# Edit .env file with your settings
# Default values are already set in .env
cat .env
```

### 4. Start the Development Server
```bash
npm run start:dev
```

The server will start on http://localhost:3000

## Testing the API

### 1. Register a Patient
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+12345678901",
    "role": "patient"
  }'
```

### 2. Register a Doctor
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "Password123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+12345678902",
    "role": "doctor"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Password123!"
  }'
```

Response will include:
```json
{
  "user": {
    "id": "...",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    ...
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer"
}
```

### 4. Get Your Profile (Authenticated)
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5. View All Users (Doctor/Psychiatrist only)
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer DOCTOR_TOKEN_HERE"
```

## Supported User Roles
- `patient`
- `doctor`
- `nurse`
- `psychiatrist`
- `carer`

## Project Scripts

```bash
# Development
npm run start:dev        # Run in watch mode

# Building
npm run build            # Build the project

# Production
npm run start:prod       # Run compiled code

# Linting & Formatting
npm run lint             # Lint code
npm run format           # Format code with Prettier

# Testing
npm run test             # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage
npm run test:e2e        # Run e2e tests
```

## Database Architecture

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('patient', 'doctor', 'nurse', 'psychiatrist', 'carer'),
  profilePicture TEXT,
  bio TEXT,
  isVerified BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Next Steps

1. **API Testing**: Use Postman or Insomnia to test endpoints
2. **Frontend Integration**: Update your Next.js frontend to use the backend API
3. **Email Verification**: Implement email verification system
4. **Additional Features**:
   - Password reset functionality
   - User profile updates
   - **Appointment booking system** (see APIs below)
   - Availability management for doctors

---

## Booking & Availability APIs
All endpoints require a valid JWT obtained through `/auth/login` except where noted.

### Provider Availability (doctor/nurse/psychiatrist/carer)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/providers/me/availabilities` | `{ startTime, endTime }` (ISO strings) | Create a free slot. Can only create if not booked. |
| GET  | `/providers/me/availabilities` | none | List your own availability slots. |
| PATCH | `/providers/me/availabilities/:id` | partial `{ startTime?, endTime? }` | Edit an unbooked slot. |
| DELETE | `/providers/me/availabilities/:id` | none | Remove an unbooked slot. |

### Searching & Booking (patients)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/providers` | none | Retrieve providers with at least one future, unbooked slot. Roles restricted to medical staff. Returns user info. |
| GET | `/providers/:id/availabilities` | none | Get available time slots for a specific provider. |
| POST | `/bookings` | `{ providerId, startTime, endTime, consultationType }` | Create a booking request. Status defaults to `pending`. Patient is notified via WhatsApp and in‑app notification. Provider receives a WhatsApp link to their dashboard. |
| GET | `/bookings` | none | List bookings for the current user; patients see their requests, providers see requests made to them. |

### Booking Actions (providers)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| PATCH | `/bookings/:id/status` | `{ status, meetingLink? }` | Approve/reject/cancel a booking. Changing status to `confirmed` will send messages to the patient; include `meetingLink` for video consultations. |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | Retrieve in‑app notifications for the authenticated user. |

> **Note:** All date-times must be in ISO 8601 string format and in UTC.

### Workflow Summary
1. Provider adds available slots.  
2. Patient browses providers and slots, then books one.  
3. Slot marked booked, provider/patient receive WhatsApp + in‑app notifications.  
4. Provider confirms or rejects via dashboard link.  
5. Patient gets final confirmation with video link or physical visit instructions.

These APIs mirror the professional booking process and can be consumed by your frontend.

## Troubleshooting

### Port 3000 Already in Use
```bash
# Change PORT in .env
PORT=3001
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
# Option 1: Using Docker
docker-compose ps

# Option 2: Manual PostgreSQL
pg_isready -h localhost -p 5432
```

### JWT Errors
- Ensure the JWT_SECRET is defined in .env
- Check that the token is properly included in the Authorization header

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USERNAME` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `DB_NAME` | Database name | doctorshub |
| `JWT_SECRET` | JWT signing key | your_secret_key |
| `JWT_EXPIRATION` | Token expiry in seconds | 3600 |
| `PORT` | Application port | 3000 |
| `NODE_ENV` | Environment | development |

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Passport.js Documentation](http://www.passportjs.org/)
- [JWT.io](https://jwt.io)

## Support

For issues or questions, check:
1. Console output for detailed error messages
2. `.env` configuration
3. PostgreSQL connection status
4. Access token validity
