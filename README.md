# DoctorsHub Backend - NestJS

A comprehensive healthcare booking system backend built with NestJS, featuring authentication and role-based access control for patients, doctors, nurses, psychiatrists, and carers.

## Features

- ✅ JWT-based Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ User Registration and Login for all roles
- ✅ PostgreSQL Database with TypeORM
- ✅ Global Validation Pipes
- ✅ CORS Configuration
- ✅ Password Hashing with Bcrypt

## Project Structure

```
src/
├── auth/
│   ├── decorators/
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   └── auth.dto.ts
│   ├── guards/
│   │   ├── jwt.guard.ts
│   │   └── roles.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── app.module.ts
└── main.ts
```

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up PostgreSQL:**
   - Create a PostgreSQL database named `doctorshub`
   - Update the `.env` file with your database credentials

3. **Configure environment variables:**

Edit `.env` with your settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=doctorshub
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRATION=3600
PORT=3000
NODE_ENV=development
```

## Running the Application

**Development mode:**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "patient"
}
```

**Roles:** `patient`, `doctor`, `nurse`, `psychiatrist`, `carer`

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securePassword123"
}
```

#### Get Profile (Protected)
```bash
GET /auth/profile
Authorization: Bearer <access_token>
```

### Users

#### Get All Users (Admin/Doctor/Psychiatrist only)
```bash
GET /users
Authorization: Bearer <access_token>
```

#### Get User by ID
```bash
GET /users/:id
Authorization: Bearer <access_token>
```

#### Get Users by Role
```bash
GET /users/role/:role
Authorization: Bearer <access_token>
```

## User Roles

- **Patient**: Can book appointments, view their own profile
- **Doctor**: Can view all users, manage appointments
- **Nurse**: Support role
- **Psychiatrist**: Can view all users, manage appointments
- **Carer**: Support role

## Authentication Flow

1. User registers with email, password, name, phone, and role
2. Password is hashed using bcrypt
3. User receives a JWT token
4. Token is used for subsequent requests in the `Authorization: Bearer <token>` header
5. JWT payload includes user ID, email, role, and name

## Next Steps

1. **Email Verification**: Implement email verification on registration
2. **Password Reset**: Add password reset functionality
3. **Profile Management**: Add endpoints to update user profiles
4. **Appointment Booking**: Create appointment management system
5. **User Dashboard**: Build role-specific dashboards for the frontend

## Environment Setup for Frontend Integration

Update the CORS origin in `src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
});
```

## Database Migrations

The application uses TypeORM with auto-synchronization enabled in development. For production:

1. Set `synchronize: false` in `app.module.ts`
2. Create proper migrations using TypeORM CLI

```bash
npx typeorm migration:generate -n CreateInitialSchema
npx typeorm migration:run
```

## Technologies Used

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Password Hashing**: Bcrypt
- **Config**: @nestjs/config

## Troubleshooting

**Database Connection Error:**
- Ensure PostgreSQL is running
- Check `.env` credentials
- Verify database exists

**JWT Errors:**
- Change `JWT_SECRET` to a strong random string
- Ensure token is included in Authorization header

**CORS Errors:**
- Update the frontend URL in CORS configuration
- Ensure frontend sends requests with credentials

## Support

For more information, refer to:
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Passport Documentation](http://www.passportjs.org/)
