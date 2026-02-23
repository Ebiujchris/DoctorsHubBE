export const JWT_CONSTANTS = {
  SECRET_KEY: process.env.JWT_SECRET || 'your_secret_key',
  EXPIRATION: process.env.JWT_EXPIRATION || '3600',
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden resource',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
};

export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  USER_VERIFIED: 'User verified successfully',
};
