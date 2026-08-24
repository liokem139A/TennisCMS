import { NextApiRequest, NextApiResponse } from 'next';
import {
  validateLoginCredentials,
  verifyPassword,
  generateToken,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  checkLoginAttempts,
} from '@/lib/auth';
import { compose, withMethod, withLogging, withCORS } from '@/lib/middleware';

// Mock database - Replace with real DynamoDB calls
const mockUsers: Record<string, any> = {
  'test@example.com': {
    id: 'user_1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'ambassador',
    clubId: 'club_1',
    passwordHash: '$2b$12$w8h1c0vZx9o9pj8k1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f', // bcrypt hash of "Password123!"
    isActive: true,
  },
};

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    clubId?: string;
  };
  error?: string;
}

async function loginHandler(req: NextApiRequest, res: NextApiResponse<LoginResponse>) {
  try {
    // Validate request body
    const credentials = validateLoginCredentials(req.body as LoginRequest);

    // Check rate limiting
    const attempts = await checkLoginAttempts(credentials.email);
    if (attempts > 5) {
      await recordFailedLoginAttempt(credentials.email);
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
      });
    }

    // Find user in mock database
    // TODO: Replace with real database query
    const user = mockUsers[credentials.email];

    if (!user) {
      await recordFailedLoginAttempt(credentials.email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Please contact support.',
      });
    }

    // Verify password
    const passwordValid = await verifyPassword(credentials.password, user.passwordHash);

    if (!passwordValid) {
      await recordFailedLoginAttempt(credentials.email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Clear login attempts on success
    await clearLoginAttempts(credentials.email);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
    });

    // Set secure HTTP-only cookie
    res.setHeader(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clubId: user.clubId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Login failed';

    return res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
}

export default compose(withMethod('POST'), withLogging, withCORS)(loginHandler);
