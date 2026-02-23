# 🏥 DoctorsHub Backend Setup - Complete Guide

## ✅ What Has Been Set Up

Your NestJS backend for the healthcare booking system is now ready with complete authentication support for all user types!

### Files Created

#### Core Configuration
- ✅ `package.json` - All dependencies configured
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `.env` - Environment variables (ready to use)
- ✅ `.env.example` - Environment template
- ✅ `docker-compose.yml` - PostgreSQL + PgAdmin setup
- ✅ `nest-cli.json` - NestJS CLI config
- ✅ `.eslintrc.js` - Linting rules
- ✅ `.prettierrc` - Code formatting
- ✅ `.gitignore` - Git ignore rules

#### Application Files
- ✅ `src/main.ts` - Application entry point with CORS
- ✅ `src/app.module.ts` - Root module with database config

#### Authentication Module (`src/auth/`)
- ✅ `auth.service.ts` - Register, login, validation logic
- ✅ `auth.controller.ts` - API endpoints
- ✅ `auth.module.ts` - Auth module configuration
- ✅ `dto/auth.dto.ts` - Data transfer objects
- ✅ `strategies/jwt.strategy.ts` - JWT token strategy
- ✅ `guards/jwt.guard.ts` - JWT authentication guard
- ✅ `guards/roles.guard.ts` - Role-based access control
- ✅ `decorators/roles.decorator.ts` - @Roles() decorator

#### Users Module (`src/users/`)
- ✅ `entities/user.entity.ts` - User database model
- ✅ `users.service.ts` - User business logic
- ✅ `users.controller.ts` - User endpoints
- ✅ `users.module.ts` - Users module config

#### Utilities
- ✅ `src/common/types/index.ts` - TypeScript types
- ✅ `src/common/constants/index.ts` - Constants

#### Documentation
- ✅ `README.md` - Full documentation
- ✅ `QUICKSTART.md` - Quick start guide

---

## 🚀 Getting Started (5 Steps)

### Step 1: Install Dependencies
```bash
cd /Users/daphnenaggayi/Desktop/DocHub/DoctorsHubBE
npm install
```

### Step 2: Start PostgreSQL Database
```bash
# Using Docker (Recommended)
docker-compose up -d

# Verify PostgreSQL is running
docker-compose ps
```

### Step 3: Verify Database Connection
```bash
# The database will auto-create on first run
# You can access PgAdmin at: http://localhost:5050
# Email: admin@example.com
# Password: admin
```

### Step 4: Start Development Server
```bash
npm run start:dev
```

You'll see:
```
[Nest] ... - 02/23/2026, 10:00:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +123ms
[Nest] ... - 02/23/2026, 10:00:00 AM     LOG [InstanceLoader] AuthModule dependencies initialized +456ms
...
Application is running on: http://localhost:3000
```

### Step 5: Test Authentication
```bash
# Register a patient
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test@1234",
    "firstName": "John",
    "lastName": "Patient",
    "phone": "+12345678901",
    "role": "patient"
  }'
```

---

## 🔐 Authentication Features Implemented

### Register Endpoint
```
POST /auth/register
```
**Supported Roles:** `patient`, `doctor`, `nurse`, `psychiatrist`, `carer`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+12345678901",
  "role": "patient"
}
```

**Features:**
- ✅ Duplicate email check
- ✅ Bcrypt password hashing
- ✅ Auto JWT token generation
- ✅ Returns user profile + token

### Login Endpoint
```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Features:**
- ✅ Email/password verification
- ✅ Account active check
- ✅ Bcrypt password comparison
- ✅ JWT token generation

### Protected Endpoints
```
GET /auth/profile (Protected with JwtAuthGuard)
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Role-Based Access
```
GET /users (Only doctor/psychiatrist)
GET /users/:id (All authenticated users)
GET /users/role/:role (Only doctor/psychiatrist)
```

---

## 📁 Project Structure

```
DoctorsHubBE/
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── users/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── common/
│   │   ├── constants/
│   │   │   └── index.ts
│   │   └── types/
│   │       └── index.ts
│   ├── app.module.ts
│   └── main.ts
├── dist/ (generated on build)
├── node_modules/ (installed packages)
├── .env (configuration - already set up)
├── .env.example (template)
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── nest-cli.json
├── package.json
├── README.md
├── QUICKSTART.md
├── tsconfig.json
└── SETUP_GUIDE.md (this file)
```

---

## 🔑 Key Features by User Role

| Feature | Patient | Doctor | Nurse | Psychiatrist | Carer |
|---------|---------|--------|-------|--------------|-------|
| Register | ✅ | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Users | ❌ | ✅ | ❌ | ✅ | ❌ |
| View by Role | ❌ | ✅ | ❌ | ✅ | ❌ |

---

## 📱 Frontend Integration

### Update Next.js Frontend

#### 1. Install Axios (or fetch)
```bash
npm install axios
```

#### 2. Create API Service
```typescript
// lib/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};
```

#### 3. Use in Your Components
```typescript
// pages/auth/register.tsx
import { authAPI } from '@/lib/api';

export default function Register() {
  const handleRegister = async (formData) => {
    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
      });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Redirect to dashboard
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your form JSX
  );
}
```

---

## 🛠️ Available Commands

### Development
```bash
npm run start:dev        # Hot reload server
npm run start:debug      # Debug mode
```

### Building
```bash
npm run build            # Compile TypeScript
npm run start:prod       # Run production build
```

### Code Quality
```bash
npm run lint             # Check code style
npm run format           # Auto-format code
```

### Testing
```bash
npm run test             # Run unit tests
npm run test:watch       # Re-run on changes
npm run test:cov         # With coverage report
npm run test:e2e         # End-to-end tests
```

---

## 🗄️ Database

### Automatic Setup
- Database: `doctorshub`
- User: `postgres`
- Password: `password`
- Port: `5432`

### Tables
- `users` - All user accounts with roles

### Access Database
```bash
# Using PgAdmin (Recommended)
# http://localhost:5050
# Email: admin@example.com
# Password: admin
# Add new server: postgres:5432

# Using psql CLI
psql -h localhost -U postgres -d doctorshub
\dt (list tables)
SELECT * FROM users;
```

---

## 🔐 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=doctorshub

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRATION=3600

# App
PORT=3000
NODE_ENV=development
```

⚠️ **Security Note**: In production, use a strong JWT_SECRET and store in secure vault.

---

## 📝 Next Steps - Recommended Implementation Order

### Phase 1: Core Features (Already Done ✅)
- ✅ User registration with role selection
- ✅ User login with JWT
- ✅ Role-based access control

### Phase 2: Email Verification (Next)
1. Integrate email service (SendGrid, Gmail, etc.)
2. Send verification email on registration
3. Create email verification endpoint
4. Mark user as verified

### Phase 3: Password Reset
1. Create password reset request endpoint
2. Send reset link via email
3. Create password reset form
4. Validate reset token and update password

### Phase 4: User Profiles
1. Add profile picture upload
2. Create profile update endpoint
3. Add profile completion flow
4. Add profile view pages

### Phase 5: Appointments
1. Create appointment entity
2. Build appointment booking endpoints
3. Add availability management for doctors
4. Create appointment calendar view

### Phase 6: Advanced Features
- Doctor ratings/reviews
- Appointment reminders
- Prescription management
- Medical records system
- Payment integration

---

## 🐛 Troubleshooting

### Issue: "Port 3000 already in use"
```bash
# Change in .env
PORT=3001
```

### Issue: "Cannot connect to database"
```bash
# Check Docker
docker-compose ps

# Restart Docker
docker-compose down
docker-compose up -d

# Or check local PostgreSQL
pg_isready -h localhost -p 5432
```

### Issue: "JWT error / Token invalid"
- Ensure `JWT_SECRET` is defined in `.env`
- Verify token is in `Authorization: Bearer <token>` format
- Check token hasn't expired (default: 1 hour)

### Issue: "CORS error from frontend"
- Update CORS origin in `src/main.ts` with your frontend URL
- Restart server after changes

---

## 📚 Useful Resources

- **NestJS Docs**: https://docs.nestjs.com
- **TypeORM Docs**: https://typeorm.io
- **Passport JWT**: http://www.passportjs.org/packages/passport-jwt/
- **JWT.io**: https://jwt.io (decode tokens)

---

## ✨ Summary

Your backend is now ready with:
- ✅ Complete authentication system
- ✅ 5 user roles implemented
- ✅ JWT-based security
- ✅ Role-based access control
- ✅ PostgreSQL database
- ✅ TypeORM ORM
- ✅ Global validation
- ✅ Error handling
- ✅ CORS configured

**Next Action**: Run `npm install` and `npm run start:dev` to launch your backend!

---

**Created**: 23 February 2026
**Backend Framework**: NestJS
**Database**: PostgreSQL
**Auth**: JWT + Passport
