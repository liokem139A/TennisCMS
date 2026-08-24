import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Type definitions
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ambassador' | 'coordinator' | 'admin' | 'program_team';
  clubId?: string;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  clubId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  clubId?: string;
}

// Validation schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  clubId: z.string().optional(),
});

// Authentication utility functions
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRY = process.env.NEXT_PUBLIC_JWT_EXPIRY || '2592000000'; // 30 days

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error}`);
  }
}

/**
 * Compare a password with its hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Password verification failed: ${error}`);
  }
}

/**
 * Generate a JWT token
 * @param payload User payload
 * @returns JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '30d',
      algorithm: 'HS256',
    });
  } catch (error) {
    throw new Error(`Token generation failed: ${error}`);
  }
}

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload if valid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return decoded as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Decode a JWT token without verification
 * @param token JWT token to decode
 * @returns Decoded payload
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.decode(cleanToken);
    return decoded as JWTPayload | null;
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token JWT token
 * @returns True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Validate login credentials
 * @param credentials Login credentials
 * @returns Validation result
 */
export function validateLoginCredentials(credentials: unknown) {
  try {
    return LoginSchema.parse(credentials);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validate registration data
 * @param data Registration data
 * @returns Validation result
 */
export function validateRegisterData(data: unknown) {
  try {
    return RegisterSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Create a user object (for database storage)
 * @param data Registration data
 * @param passwordHash Hashed password
 * @returns User object
 */
export function createUserObject(data: ReturnType<typeof validateRegisterData>, passwordHash: string): User {
  return {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: 'ambassador', // Default role for new users
    clubId: data.clubId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Extract authorization token from headers
 * @param authHeader Authorization header
 * @returns Token or null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return authHeader;
}

/**
 * Rate limiting helper - check login attempts
 * @param email User email
 * @returns Number of recent login attempts
 */
export async function checkLoginAttempts(email: string): Promise<number> {
  // This would be implemented with a database or cache (Redis)
  // For now, returning a placeholder implementation
  // TODO: Implement rate limiting with Redis or DynamoDB
  return 0;
}

/**
 * Record a failed login attempt
 * @param email User email
 */
export async function recordFailedLoginAttempt(email: string): Promise<void> {
  // TODO: Implement rate limiting with Redis or DynamoDB
  console.log(`Failed login attempt for: ${email}`);
}

/**
 * Clear login attempts after successful authentication
 * @param email User email
 */
export async function clearLoginAttempts(email: string): Promise<void> {
  // TODO: Implement rate limiting with Redis or DynamoDB
  console.log(`Cleared login attempts for: ${email}`);
}

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  validateLoginCredentials,
  validateRegisterData,
  createUserObject,
  extractTokenFromHeader,
  checkLoginAttempts,
  recordFailedLoginAttempt,
  clearLoginAttempts,
};
